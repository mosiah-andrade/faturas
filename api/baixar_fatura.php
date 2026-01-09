<?php
// faturas/api/baixar_fatura.php
header("Access-Control-Allow-Origin: *");

require_once 'Database.php';

try {
    if (empty($_GET['fatura_id'])) {
        http_response_code(400);
        header("Content-Type: application/json");
        echo json_encode(['message' => 'ID da fatura é obrigatório.']);
        exit();
    }

    $database = Database::getInstance();
    $pdo = $database->getConnection();
    $faturaId = $_GET['fatura_id'];

    $stmt = $pdo->prepare(
        "SELECT f.id, f.mes_referencia, f.data_vencimento, f.valor_total, f.taxa_minima, f.percentual_desconto, lm.data_leitura, lm.numero_dias,
            lm.consumo_kwh, lm.injecao_kwh,
                i.codigo_uc, i.endereco_instalacao, i.tipo_de_ligacao, i.tipo_instalacao, c.nome AS cliente_nome, c.documento
         FROM faturas f
         LEFT JOIN leituras_medidor lm ON f.instalacao_id = lm.instalacao_id AND f.mes_referencia = lm.mes_referencia
         JOIN instalacoes i ON f.instalacao_id = i.id
         JOIN clientes c ON i.cliente_id = c.id
         WHERE f.id = ?"
    );
    $stmt->execute([$faturaId]);
    $fatura = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$fatura) {
        http_response_code(404);
        header("Content-Type: application/json");
        echo json_encode(['message' => 'Fatura não encontrada.']);
        exit();
    }

    // Gerar HTML simples para download (pode ser convertido em PDF posteriormente)
    $html = "<!doctype html><html><head><meta charset='utf-8'><title>Fatura #{$fatura['id']}</title></head><body>";
    $html .= "<h1>Fatura #{$fatura['id']}</h1>";
    $html .= "<p><strong>Cliente:</strong> {$fatura['cliente_nome']} ({$fatura['documento']})</p>";
    $html .= "<p><strong>UC:</strong> {$fatura['codigo_uc']}</p>";
    $html .= "<p><strong>Mes:</strong> " . date('m/Y', strtotime($fatura['mes_referencia'])) . "</p>";
    $html .= "<p><strong>Vencimento:</strong> " . date('d/m/Y', strtotime($fatura['data_vencimento'])) . "</p>";
    $html .= "<p><strong>Consumo (kWh):</strong> " . ($fatura['consumo_kwh'] ?? 'N/A') . "</p>";
    $html .= "<p><strong>Energia Injetada (kWh):</strong> " . ($fatura['injecao_kwh'] ?? 'N/A') . "</p>";
    $html .= "<p><strong>Taxa Mínima (R$):</strong> R$ " . number_format($fatura['taxa_minima'] ?? 0, 2, ',', '.') . "</p>";
    $html .= "<p><strong>Desconto (%):</strong> " . ($fatura['percentual_desconto'] ?? 0) . "%</p>";
    $html .= "<p><strong>Valor Total (R$):</strong> R$ " . number_format($fatura['valor_total'] ?? 0, 2, ',', '.') . "</p>";
    $html .= "</body></html>";

    header("Content-Type: text/html; charset=UTF-8");
    header("Content-Disposition: attachment; filename=\"fatura-{$fatura['id']}.html\"");
    echo $html;

} catch (Exception $e) {
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode(['message' => 'Erro ao gerar arquivo.', 'details' => $e->getMessage()]);
}
?>