<?php
// faturas/api/get_faturas.php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
// Desabilita o cache para garantir que os dados sejam sempre os mais recentes
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

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

    // CORREÇÃO 1: Consulta do cliente simplificada para evitar erros de GROUP BY
    $stmtCliente = $pdo->prepare("
        SELECT 
            c.id, c.nome, c.documento, c.endereco_cobranca,
            i.integrador_id, i.tipo_contrato, i.tipo_instalacao, 
            i.valor_tusd, i.valor_te, i.tipo_de_ligacao
        FROM clientes c
        LEFT JOIN instalacoes i ON c.id = i.cliente_id
        WHERE c.id = ?
        LIMIT 1 -- Garante que apenas um resultado seja retornado
    ");
    $stmtCliente->execute([$clienteId]);
    $cliente = $stmtCliente->fetch(PDO::FETCH_ASSOC);

    if (!$cliente) {
        http_response_code(404);
        echo json_encode(['message' => 'Cliente não encontrado.']);
        exit();
    }
    $response['cliente'] = $cliente;

    // CORREÇÃO 2: Consulta de faturas com colunas explícitas para evitar ambiguidade
    $stmtFaturas = $pdo->prepare(
        "SELECT 
            faturas.id, 
            faturas.mes_referencia, 
            faturas.data_vencimento, 
            faturas.valor_total, 
            faturas.status, 
            lm.consumo_kwh 
         FROM faturas 
         LEFT JOIN leituras_medidor lm ON faturas.instalacao_id = lm.instalacao_id AND faturas.mes_referencia = lm.mes_referencia
         WHERE faturas.cliente_id = ? 
         ORDER BY faturas.mes_referencia DESC"
    );
    $stmtFaturas->execute([$clienteId]);
    $faturas = $stmtFaturas->fetchAll(PDO::FETCH_ASSOC);

    $response['faturas'] = $faturas;

    http_response_code(200);
    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    // Retorna o detalhe do erro para facilitar a depuração, se necessário
    echo json_encode(['message' => 'Erro ao buscar dados no banco de dados.', 'details' => $e->getMessage()]);
}
?>