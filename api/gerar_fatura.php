<?php
// faturas/api/gerar_fatura.php

// --- Código de Diagnóstico (pode ser removido em produção) ---
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

$configFile = __DIR__ . '/../config.php';
$config = require $configFile;

try {
    $pdo = new PDO("mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8", $config['db_user'], $config['db_pass']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(['message' => 'FALHA NA CONEXÃO COM O BANCO.', 'details' => $e->getMessage()]));
}

$data = json_decode(file_get_contents("php://input"));

// Validação dos novos dados de entrada
if (
    empty($data->instalacao_id) ||
    !isset($data->valor_total) || // Agora o valor total é obrigatório
    empty($data->mes_referencia) ||
    empty($data->data_vencimento)
) {
    http_response_code(400);
    die(json_encode(['message' => 'Dados incompletos. Instalação, Mês de Referência, Valor e Vencimento são obrigatórios.']));
}

$instalacaoId = $data->instalacao_id;
$valorFatura = (float)$data->valor_total;
$mesReferencia = $data->mes_referencia . '-01';
$dataVencimento = $data->data_vencimento;
// Consumo e injeção são opcionais, para histórico
$consumoKwh = isset($data->consumo_kwh) ? (float)$data->consumo_kwh : 0;
$injecaoKwh = isset($data->injecao_kwh) ? (float)$data->injecao_kwh : 0;

try {
    $pdo->beginTransaction();

    // 1. Buscar ID do cliente
    $stmt = $pdo->prepare("SELECT cliente_id FROM instalacoes WHERE id = ?");
    $stmt->execute([$instalacaoId]);
    $instalacao = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$instalacao) {
        throw new Exception("Instalação não encontrada.");
    }
    $clienteId = $instalacao['cliente_id'];

    // 2. Gravar a leitura do medidor para histórico (opcional, mas recomendado)
    $stmtLeitura = $pdo->prepare("INSERT INTO leituras_medidor (instalacao_id, mes_referencia, consumo_kwh, injecao_kwh, data_leitura) VALUES (?, ?, ?, ?, CURDATE()) ON DUPLICATE KEY UPDATE consumo_kwh = VALUES(consumo_kwh), injecao_kwh = VALUES(injecao_kwh)");
    $stmtLeitura->execute([$instalacaoId, $mesReferencia, $consumoKwh, $injecaoKwh]);

    // 3. Inserir a fatura principal com o valor manual
    $dataEmissao = date('Y-m-d');
    $stmtFatura = $pdo->prepare("INSERT INTO faturas (cliente_id, instalacao_id, mes_referencia, data_emissao, data_vencimento, valor_total, status) VALUES (?, ?, ?, ?, ?, ?, 'pendente')");
    $stmtFatura->execute([$clienteId, $instalacaoId, $mesReferencia, $dataEmissao, $dataVencimento, $valorFatura]);
    $faturaId = $pdo->lastInsertId();

    // 4. Inserir um item único na fatura
    $stmtItem = $pdo->prepare("INSERT INTO fatura_itens (fatura_id, descricao, valor_total_item) VALUES (?, ?, ?)");
    $stmtItem->execute([$faturaId, 'Serviços de Geração de Energia Solar', $valorFatura]);

    $pdo->commit();

    http_response_code(201);
    echo json_encode(['message' => 'Fatura manual gerada com sucesso!', 'fatura_id' => $faturaId]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    die(json_encode(['message' => 'Erro ao gerar fatura.', 'details' => $e->getMessage()]));
}
?>