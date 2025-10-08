<?php
// faturas/api/get_faturas.php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

require_once 'Database.php';

try {
    $database = Database::getInstance();
    $pdo = $database->getConnection();

    if (empty($_GET['cliente_id'])) {
        http_response_code(400);
        echo json_encode(['message' => 'O ID do cliente é obrigatório.']);
        exit();
    }

    $clienteId = $_GET['cliente_id'];
    $response = [];
    
    // 1. Buscar informações do cliente (sem alteração)
    $stmtCliente = $pdo->prepare("
        SELECT c.id, c.nome, c.documento, c.endereco_cobranca, i.integrador_id 
        FROM clientes c
        LEFT JOIN instalacoes i ON c.id = i.cliente_id
        WHERE c.id = ?
        GROUP BY c.id
    ");
    $stmtCliente->execute([$clienteId]);
    $cliente = $stmtCliente->fetch(PDO::FETCH_ASSOC);

    if (!$cliente) {
        http_response_code(404);
        echo json_encode(['message' => 'Cliente não encontrado.']);
        exit();
    }
    $response['cliente'] = $cliente;

    // 2. MUDANÇA AQUI: Buscar faturas junto com dados de leitura
    $stmtFaturas = $pdo->prepare(
        "SELECT 
            f.id, f.mes_referencia, f.data_vencimento, f.valor_total, f.status,
            lm.consumo_kwh, lm.injecao_kwh
         FROM faturas f
         LEFT JOIN leituras_medidor lm ON f.instalacao_id = lm.instalacao_id AND f.mes_referencia = lm.mes_referencia
         WHERE f.cliente_id = ? 
         ORDER BY f.mes_referencia DESC"
    );
    $stmtFaturas->execute([$clienteId]);
    $faturas = $stmtFaturas->fetchAll(PDO::FETCH_ASSOC);

    $response['faturas'] = $faturas;

    http_response_code(200);
    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erro ao buscar dados no banco de dados.', 'details' => $e->getMessage()]);
}
?>