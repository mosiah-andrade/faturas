<?php
// faturas/api/get_detalhes_instalacao.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

require_once 'Database.php';

try {
    $database = Database::getInstance();
    $pdo = $database->getConnection();

    if (empty($_GET['instalacao_id'])) {
        http_response_code(400);
        echo json_encode(['message' => 'O ID da instalação é obrigatório.']);
        exit();
    }

    $stmt = $pdo->prepare("
        SELECT 
            i.id, 
            i.cliente_id, 
            i.integrador_id,
            i.codigo_uc, 
            i.endereco_instalacao, 
            i.tipo_de_ligacao, 
            i.tipo_contrato, 
            i.tipo_instalacao, 
            i.regra_faturamento,
            c.nome as cliente_nome,
            c.documento
        FROM instalacoes i
        JOIN clientes c ON i.cliente_id = c.id
        WHERE i.id = ?
    ");
    $stmt->execute([$_GET['instalacao_id']]);
    $instalacao = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$instalacao) {
        http_response_code(404);
        echo json_encode(['message' => 'Instalação não encontrada.']);
        exit();
    }

    http_response_code(200);
    echo json_encode($instalacao);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erro ao buscar instalação.', 'details' => $e->getMessage()]);
}
?>
