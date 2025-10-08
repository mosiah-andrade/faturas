<?php
// faturas/api/listar_integradores.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

// Inclui a nova classe de banco de dados
require_once 'Database.php';

try {
    // Pega a instância única do banco de dados e obtém a conexão
    $database = Database::getInstance();
    $pdo = $database->getConnection();

    // O resto do seu código permanece o mesmo
    $stmt = $pdo->prepare("SELECT id, nome_do_integrador, numero_de_contato FROM integradores ORDER BY id DESC");
    $stmt->execute();
    $integradores = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode($integradores);

} catch (Exception $e) {
    // Captura exceções tanto da conexão quanto da consulta
    http_response_code(500);
    echo json_encode(['message' => 'Erro no servidor.', 'details' => $e->getMessage()]);
}
?>