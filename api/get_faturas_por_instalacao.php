<?php
// faturas/api/get_faturas_por_instalacao.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

require_once 'Database.php';

try {
    $database = Database::getInstance();
    $pdo = $database->getConnection();

    if (empty($_GET['instalacao_id'])) {
        http_response_code(400);
        echo json_encode(['message' => 'O ID da instalação é obrigatório.']);
        exit();
    }

    $instalacaoId = $_GET['instalacao_id'];

    $stmt = $pdo->prepare(
        "SELECT f.id, f.instalacao_id, f.cliente_id, f.mes_referencia, f.data_vencimento, f.valor_total, f.status,
                lm.consumo_kwh, lm.injecao_kwh
         FROM faturas f
         LEFT JOIN leituras_medidor lm ON f.instalacao_id = lm.instalacao_id AND f.mes_referencia = lm.mes_referencia
         WHERE f.instalacao_id = ?
         ORDER BY f.mes_referencia DESC"
    );
    $stmt->execute([$instalacaoId]);
    $faturas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($faturas);

} catch (Exception $e) {
    http_response_code(500);
    $err = ['message' => 'Erro ao buscar faturas.', 'details' => $e->getMessage()];
    // Log completo para diagnóstico
    $logEntry = date('Y-m-d H:i:s') . " - get_faturas_por_instalacao error - inst_id=" . ($_GET['instalacao_id'] ?? 'NULL') . " - " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n\n";
    @file_put_contents(__DIR__ . '/error_log.txt', $logEntry, FILE_APPEND);
    echo json_encode($err);
}
?>