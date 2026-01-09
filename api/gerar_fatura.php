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

// Suporte para download via GET ?fatura_id=NN
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET['fatura_id'])) {
    try {
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
            header('Content-Type: application/json');
            echo json_encode(['message' => 'Fatura não encontrada.']);
            exit();
        }

        // Formatações
        $months = [1=> 'janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
        $dtMes = new DateTime($fatura['mes_referencia']);
        $monthNum = (int)$dtMes->format('m');
        $yearNum = $dtMes->format('Y');
        $mesFormatado = $months[$monthNum] . ' ' . $yearNum;

        $formatCurrency = function($v) {
            return 'R$ ' . number_format((float)($v ?? 0), 2, ',', '.');
        };

        $formatDate = function($d) {
            if (empty($d)) return 'N/A';
            $dd = new DateTime($d);
            return $dd->format('d/m/Y');
        };

        // HTML seguindo o modelo de FaturaDetalhesPage.jsx
        $html = "<!doctype html><html><head><meta charset='utf-8'><title>Fatura #{$fatura['id']}</title>";
        $html .= "<style>
            body{font-family:Arial,Helvetica,sans-serif;color:#333;margin:20px}
            .detalhes-header h1{color:#222}
            .card{background:#fff;border:1px solid #e6e6e6;padding:16px;margin-bottom:12px;border-radius:6px}
            .info-grid p{margin:6px 0}
            .subtotal,.valor-total{font-size:1.05rem;font-weight:700}
            .desconto{color:#d9534f}
        </style>";
            // Tenta carregar o CSS do projeto para manter o mesmo visual
            $cssPath = realpath(__DIR__ . '/../gestao-fatura/src/pages/FaturaDetalhesPage.css');
            if ($cssPath && file_exists($cssPath)) {
                $cssContent = file_get_contents($cssPath);
                $html .= "<style>" . $cssContent . "</style>";
            } else {
                // Fallback de estilos inline se o CSS não for encontrado
                $html .= "<style>
                    body{font-family:Arial,Helvetica,sans-serif;color:#333;margin:20px}
                    .detalhes-header h1{color:#222}
                    .card{background:#fff;border:1px solid #e6e6e6;padding:16px;margin-bottom:12px;border-radius:6px}
                    .info-grid p{margin:6px 0}
                    .subtotal,.valor-total{font-size:1.05rem;font-weight:700}
                    .desconto{color:#d9534f}
                </style>";
            }

        $html .= "</head><body>";
        $html .= "<div class='detalhes-header'><h1>Detalhes da Fatura #{$fatura['id']}</h1></div>";

        $html .= "<div class='card info-cliente'><h2>Dados do Cliente</h2><div class='info-grid'>";
        $html .= "<p><strong>Nome:</strong> {$fatura['cliente_nome']}</p>";
        $html .= "<p><strong>Documento:</strong> {$fatura['documento']}</p>";
        $html .= "<p><strong>Endereço:</strong> {$fatura['endereco_instalacao']}</p>";
        $html .= "<p><strong>Cód. UC:</strong> {$fatura['codigo_uc']}</p>";
        $html .= "</div></div>";

        $html .= "<div class='card info-fatura'><h2>Dados da Fatura</h2><div class='info-grid'>";
        $html .= "<p><strong>Mês Referência:</strong> {$mesFormatado}</p>";
        $html .= "<p><strong>Vencimento:</strong> " . $formatDate($fatura['data_vencimento']) . "</p>";
        $html .= "<p><strong>Data da Leitura:</strong> " . $formatDate($fatura['data_leitura']) . "</p>";
        $html .= "<p><strong>Tipo de Ligação:</strong> {$fatura['tipo_de_ligacao']}</p>";
        $html .= "<p><strong>Consumo (kWh):</strong> " . (($fatura['consumo_kwh'] !== null) ? $fatura['consumo_kwh'] . ' kWh' : 'N/A') . "</p>";
        $html .= "<p><strong>Taxa Mínima:</strong> " . $formatCurrency($fatura['taxa_minima'] ?? 0) . "</p>";
        $html .= "<p class='subtotal'><strong>Subtotal:</strong> " . $formatCurrency($fatura['subtotal'] ?? 0) . "</p>";
        $html .= "<p class='desconto'><strong>Desconto ({$fatura['percentual_desconto']}%):</strong> -" . $formatCurrency($fatura['valor_desconto'] ?? 0) . "</p>";
        $html .= "<p class='valor-total'><strong>Valor Total:</strong> " . $formatCurrency($fatura['valor_total'] ?? 0) . "</p>";
        $html .= "</div></div>";

        // Adiciona seção de pagamento com PIX (usa imagem embutida se disponível)
        $pixLocalPath = realpath(__DIR__ . '/../gestao-fatura/src/assets/pix.png');
        $pixSrc = '/pix.png';
        if ($pixLocalPath && file_exists($pixLocalPath)) {
            $pixData = base64_encode(file_get_contents($pixLocalPath));
            $pixSrc = 'data:image/png;base64,' . $pixData;
        }

        $html .= "<div class='card'><h2>Pagamento</h2><div class='info-grid'>";
        $html .= "<div style='min-width:160px;'><p><strong>Pague com PIX:</strong></p>";
        $html .= "<img src='" . $pixSrc . "' alt='PIX' style='width:120px;height:auto;border:1px solid #ddd;padding:6px;border-radius:6px'/>";
        $html .= "</div>";
        $html .= "<div><p><strong>CNPJ:</strong> 46.967.661/0001-91</p>";
        $html .= "<p><strong>Vencimento:</strong> " . $formatDate($fatura['data_vencimento']) . "</p>";
        $html .= "<p><strong>Total a pagar:</strong> " . $formatCurrency($fatura['valor_total'] ?? 0) . "</p>";
        $html .= "<p style='font-size:0.9em;color:#666'><em>*Favor enviar o comprovante via WhatsApp após o pagamento.</em></p></div>";
        $html .= "</div></div>";

        $html .= "</body></html>";

            // Se for solicitado PDF, tente gerar
            if (isset($_GET['format']) && strtolower($_GET['format']) === 'pdf') {
                // 1) Tenta wkhtmltopdf via exec (caminho completo para Windows)
                $canExec = function_exists('exec');
                if ($canExec) {
                    // Caminho completo do wkhtmltopdf no Windows
                    $wkhtmltopdfPath = 'C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe';
                    if (file_exists($wkhtmltopdfPath)) {
                        $tmpHtml = tempnam(sys_get_temp_dir(), 'fatura_') . '.html';
                        $tmpPdf = tempnam(sys_get_temp_dir(), 'fatura_') . '.pdf';
                        file_put_contents($tmpHtml, $html);
                        $cmd = '"' . $wkhtmltopdfPath . '" --enable-local-file-access ' . escapeshellarg($tmpHtml) . ' ' . escapeshellarg($tmpPdf) . ' 2>&1';
                        @exec($cmd, $o, $r);
                        if ($r === 0 && file_exists($tmpPdf)) {
                            header('Content-Type: application/pdf');
                            header('Content-Disposition: attachment; filename="fatura-' . $fatura['id'] . '.pdf"');
                            readfile($tmpPdf);
                            @unlink($tmpHtml);
                            @unlink($tmpPdf);
                            exit();
                        }
                        @unlink($tmpHtml);
                        @unlink($tmpPdf);
                    }
                }

                // 2) Tenta Dompdf se o autoloader existir
                $vendor = realpath(__DIR__ . '/../vendor/autoload.php');
                if ($vendor && file_exists($vendor)) {
                    require_once $vendor;
                    if (class_exists('\Dompdf\Dompdf')) {
                        $dompdf = new \Dompdf\Dompdf();
                        $dompdf->loadHtml($html);
                        $dompdf->setPaper('A4', 'portrait');
                        $dompdf->render();
                        $pdf = $dompdf->output();
                        header('Content-Type: application/pdf');
                        header('Content-Disposition: attachment; filename="fatura-' . $fatura['id'] . '.pdf"');
                        echo $pdf;
                        exit();
                    }
                }

                // 3) Fallback: não foi possível gerar PDF — retorne HTML com aviso
                header('Content-Type: text/html; charset=UTF-8');
                echo "<!doctype html><html><body><h2>A geração de PDF não está disponível no servidor.</h2><p>Segue abaixo o HTML da fatura:</p>" . $html . "</body></html>";
                exit();
            }

        header("Content-Type: text/html; charset=UTF-8");
        header("Content-Disposition: attachment; filename=\"fatura-{$fatura['id']}.html\"");
        echo $html;
        exit();

    } catch (Exception $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['message' => 'Erro ao gerar arquivo.', 'details' => $e->getMessage()]);
        exit();
    }
}

try {
    $database = Database::getInstance();
    $pdo = $database->getConnection();

    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->instalacao_id) || empty($data->mes_referencia)) {
        http_response_code(400);
        die(json_encode(['message' => 'Instalação e Mês de Referência são obrigatórios.']));
    }

    $instalacaoId = $data->instalacao_id;

    $stmtInst = $pdo->prepare("SELECT cliente_id, tipo_contrato, tipo_instalacao, regra_faturamento FROM instalacoes WHERE id = ?");
    $stmtInst->execute([$instalacaoId]);
    $instalacao = $stmtInst->fetch();

    if (!$instalacao) {
        throw new Exception("Instalação não encontrada.");
    }

    $pdo->beginTransaction();
    
    // Variáveis
    $valorFinal = 0;
    $subtotal = 0;
    $valorDesconto = 0;
    $percentualDesconto = (int)($data->percentual_desconto ?? 0);
    $consumoEmReais = (float)($data->consumo_kwh ?? 0);
    $taxaMinima = (float)($data->taxa_minima ?? 0);
    
    // Outras variáveis
    $injecaoKwh = (float)($data->injecao_kwh ?? 0);
    $creditos = (float)($data->creditos ?? 0);
    $dataLeitura = $data->data_leitura ?? null;
    $numeroDias = isset($data->numero_dias) ? (int)$data->numero_dias : null;
    $dataVencimento = $data->data_vencimento ?? null;

    if ($instalacao['tipo_contrato'] == 'Investimento') {
        if (!isset($data->consumo_kwh) || empty($data->data_leitura) || !isset($data->numero_dias) || empty($data->data_vencimento)) {
            throw new Exception("Para Investimento, Consumo, Data da Leitura, Nº de Dias e Vencimento são obrigatórios.");
        }
        
        // CORREÇÃO DA LÓGICA DE CÁLCULO
        if ($instalacao['regra_faturamento'] == 'Antes da Taxação') {
            // Subtotal é a soma de tudo antes do desconto
            $subtotal = $consumoEmReais + $taxaMinima;
            // Desconto é calculado sobre o subtotal
            $valorDesconto = $subtotal * ($percentualDesconto / 100);
            // Valor final é o subtotal menos o desconto
            $valorFinal = $subtotal - $valorDesconto;
        } else { // 'Depois da Taxação' (padrão)
            // Subtotal continua sendo a soma de tudo para clareza
            $subtotal = $consumoEmReais + $taxaMinima;
            // Desconto é calculado apenas sobre o consumo
            $valorDesconto = $consumoEmReais * ($percentualDesconto / 100);
            // Valor final é o consumo com desconto, mais a taxa mínima
            $valorFinal = ($consumoEmReais - $valorDesconto) + $taxaMinima;
        }

    } else { // Lógica para Monitoramento
        if (!isset($data->valor_total) || empty($data->data_vencimento) || empty($data->data_leitura)) {
             throw new Exception("Para Monitoramento, Valor da Fatura, Vencimento e Data da Leitura são obrigatórios.");
        }
        $valorFinal = (float)($data->valor_total ?? 0);
        $subtotal = $valorFinal;
    }

    // Grava a leitura do medidor
    $stmtLeitura = $pdo->prepare(
        "INSERT INTO leituras_medidor (instalacao_id, mes_referencia, consumo_kwh, injecao_kwh, data_leitura, numero_dias) 
         VALUES (?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE consumo_kwh = VALUES(consumo_kwh), injecao_kwh = VALUES(injecao_kwh), data_leitura = VALUES(data_leitura), numero_dias = VALUES(numero_dias)"
    );
    $stmtLeitura->execute([$instalacaoId, $data->mes_referencia . '-01', $consumoEmReais, $injecaoKwh, $dataLeitura, $numeroDias]);

    // Insere a fatura principal
    $stmtFatura = $pdo->prepare(
        "INSERT INTO faturas (cliente_id, instalacao_id, mes_referencia, data_emissao, data_vencimento, valor_total, subtotal, valor_desconto, status, taxa_minima, percentual_desconto, creditos) 
         VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?, 'pendente', ?, ?, ?)"
    );
    
    $stmtFatura->execute([
        $instalacao['cliente_id'], $instalacaoId, $data->mes_referencia . '-01',
        $dataVencimento, $valorFinal, $subtotal, $valorDesconto,
        $taxaMinima, $percentualDesconto, $creditos
    ]);
    $faturaId = $pdo->lastInsertId();
    
    if ($instalacao['tipo_contrato'] == 'Monitoramento') {
        $stmtItem = $pdo->prepare("INSERT INTO fatura_itens (fatura_id, descricao, valor_total_item) VALUES (?, ?, ?)");
        $stmtItem->execute([$faturaId, 'Serviços de Monitoramento de Energia Solar', $valorFinal]);
    }

    $pdo->commit();

    http_response_code(201);
    echo json_encode(['message' => 'Fatura gerada com sucesso!', 'fatura_id' => $faturaId]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    die(json_encode(['message' => 'Erro ao gerar fatura.', 'details' => $e->getMessage()]));
}
?>