<?php
// faturas/teste_conexao.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>Teste de Conexão com o Banco de Dados</h1>";

$configFile = __DIR__ . '/config.php';

if (!file_exists($configFile)) {
    die("<p style='color: red;'><strong>ERRO:</strong> O arquivo config.php não foi encontrado na pasta 'faturas/'.</p>");
}

$config = require $configFile;

echo "<p>Tentando conectar ao host: <strong>" . htmlspecialchars($config['db_host']) . "</strong></p>";
echo "<p>Banco de Dados: <strong>" . htmlspecialchars($config['db_name']) . "</strong></p>";

try {
    // Tenta criar a conexão com um tempo limite de 5 segundos
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5
    ];
    $pdo = new PDO("mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8", $config['db_user'], $config['db_pass'], $options);

    // Se chegou até aqui, a conexão foi bem-sucedida
    echo "<p style='color: green; font-weight: bold;'>SUCESSO! A conexão com o banco de dados foi estabelecida.</p>";

} catch (PDOException $e) {
    // Se a conexão falhou, mostra o erro detalhado
    echo "<p style='color: red; font-weight: bold;'>FALHA NA CONEXÃO!</p>";
    echo "<p style='color: red;'><strong>Detalhes do erro:</strong> " . $e->getMessage() . "</p>";
    echo "<hr>";
    echo "<p><strong>Possível Solução:</strong> Este erro (geralmente 'Connection timed out' ou 'Access denied') indica que seu servidor de hospedagem está bloqueando a conexão. Você precisa liberar o acesso remoto ao seu banco de dados no painel de controle da sua hospedagem (procure por 'MySQL Remoto' ou 'Remote MySQL' e adicione o IP do seu site ou o caractere '%' para permitir acesso).</p>";
}

?>