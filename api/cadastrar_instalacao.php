<?php
// faturas/api/cadastrar_instalacao.php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'Database.php';

try {
    $database = Database::getInstance();
    $pdo = $database->getConnection();
    
    $data = json_decode(file_get_contents("php://input"));

    // Validação dos campos obrigatórios
    if (
        empty($data->cliente_id) ||
        empty($data->integrador_id) ||
        empty($data->endereco_instalacao) ||
        empty($data->codigo_uc)
    ) {
        http_response_code(400);
        echo json_encode(['message' => 'Campos obrigatórios (Cliente, Integrador, Endereço e Código UC) devem ser preenchidos.']);
        exit();
    }

    // Inserção na tabela 'instalacoes'
    $sqlInstalacao = "INSERT INTO instalacoes (
                        cliente_id,
                        integrador_id,
                        endereco_instalacao,
                        codigo_uc,
                        tipo_de_ligacao,
                        tipo_contrato,
                        tipo_instalacao,
                        regra_faturamento
                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtInstalacao = $pdo->prepare($sqlInstalacao);
    $stmtInstalacao->execute([
        $data->cliente_id,
        $data->integrador_id,
        $data->endereco_instalacao,
        $data->codigo_uc,
        $data->tipo_de_ligacao ?? 'Monofásica',
        $data->tipo_contrato ?? 'Investimento',
        $data->tipo_instalacao ?? 'Beneficiária',
        $data->regra_faturamento ?? 'Depois da Taxação'
    ]);
    
    $instalacaoId = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        'message' => 'Instalação cadastrada com sucesso!',
        'instalacao_id' => $instalacaoId
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    
    if ($e->getCode() == 23000) {
        // O erro 23000 pode ser chave duplicada no 'codigo_uc'
        if (strpos($e->getMessage(), 'codigo_uc') !== false) {
             echo json_encode(['message' => 'Erro: Código UC já existe no sistema.']);
        } else {
             echo json_encode(['message' => 'Erro: Violação de chave única. Verifique os dados.']);
        }
    } else {
        echo json_encode(['message' => 'Erro interno ao cadastrar instalação.', 'details' => $e->getMessage()]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erro no servidor.', 'details' => $e->getMessage()]);
}
?>
