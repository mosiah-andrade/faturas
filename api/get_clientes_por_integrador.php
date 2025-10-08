<?php
// faturas/api/get_clientes_por_integrador.php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

require_once 'Database.php';

try {
    $database = Database::getInstance();
    $pdo = $database->getConnection();

    if (empty($_GET['integrador_id'])) {
        http_response_code(400);
        echo json_encode(['message' => 'O ID do integrador é obrigatório.']);
        exit();
    }

    $integradorId = $_GET['integrador_id'];

    // A MUDANÇA ESTÁ AQUI: Trocamos "i.id as instalacao_id" por "i.id as id"
    $sql = "SELECT 
                c.id as cliente_id, 
                c.nome, 
                i.id as id, -- Alterado de instalacao_id para id
                i.codigo_uc 
            FROM clientes c
            JOIN instalacoes i ON c.id = i.cliente_id
            WHERE i.integrador_id = ?";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$integradorId]);
    $instalacoes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($instalacoes);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erro ao buscar instalações por integrador.', 'details' => $e->getMessage()]);
}
?>