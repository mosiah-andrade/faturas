<?php
// faturas/api/gerar_fatura.php

ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'Database.php';

try {
    $database = Database::getInstance();
    $pdo = $database->getConnection();

    $data = json_decode(file_get_contents("php://input"));

    if (
        empty($data->instalacao_id) ||
        !isset($data->valor_total) || 
        empty($data->mes_referencia) ||
        empty($data->data_vencimento)
    ) {
        http_response_code(400);
        die(json_encode(['message' => 'Dados incompletos. Instalação, Mês de Referência, Valor e Vencimento são obrigatórios.']));
    }

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT cliente_id FROM instalacoes WHERE id = ?");
    $stmt->execute([$data->instalacao_id]);
    $instalacao = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$instalacao) {
        throw new Exception("Instalação não encontrada.");
    }
    $clienteId = $instalacao['cliente_id'];

    $stmtLeitura = $pdo->prepare("INSERT INTO leituras_medidor (instalacao_id, mes_referencia, consumo_kwh, injecao_kwh, data_leitura) VALUES (?, ?, ?, ?, CURDATE()) ON DUPLICATE KEY UPDATE consumo_kwh = VALUES(consumo_kwh), injecao_kwh = VALUES(injecao_kwh)");
    $stmtLeitura->execute([$data->instalacao_id, $data->mes_referencia . '-01', (float)($data->consumo_kwh ?? 0), (float)($data->injecao_kwh ?? 0)]);

    $stmtFatura = $pdo->prepare("INSERT INTO faturas (cliente_id, instalacao_id, mes_referencia, data_emissao, data_vencimento, valor_total, status) VALUES (?, ?, ?, CURDATE(), ?, ?, 'pendente')");
    $stmtFatura->execute([$clienteId, $data->instalacao_id, $data->mes_referencia . '-01', $data->data_vencimento, (float)$data->valor_total]);
    $faturaId = $pdo->lastInsertId();

    $stmtItem = $pdo->prepare("INSERT INTO fatura_itens (fatura_id, descricao, valor_total_item) VALUES (?, ?, ?)");
    $stmtItem->execute([$faturaId, 'Serviços de Geração de Energia Solar', (float)$data->valor_total]);

    $pdo->commit();

    http_response_code(201);
    echo json_encode(['message' => 'Fatura manual gerada com sucesso!', 'fatura_id' => $faturaId]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    die(json_encode(['message' => 'Erro ao gerar fatura.', 'details' => $e->getMessage()]));
}
?>