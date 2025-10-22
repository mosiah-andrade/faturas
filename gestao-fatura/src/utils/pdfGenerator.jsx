import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import FaturaTemplateHtml from "../components/FaturaTemplateHtml";

const GerarFaturaPdf = ({ fatura, historico }) => {
  const gerarPDF = async () => {
    const elemento = document.getElementById("fatura-html");
    if (!elemento) return alert("Elemento não encontrado!");

    // Faz um "print" do componente
    const canvas = await html2canvas(elemento, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
    pdf.save(`fatura-${fatura.cliente_nome}.pdf`);
  };

  return (
    <div>
      {/* Exibe a fatura na tela */}
      <FaturaTemplateHtml fatura={fatura} historico={historico} />

      {/* Botão de geração */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button onClick={gerarPDF}>Baixar PDF</button>
      </div>
    </div>
  );
};

export default GerarFaturaPdf;
