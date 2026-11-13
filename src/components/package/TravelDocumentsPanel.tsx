"use client";
import React from "react";
import { ExternalLink } from "lucide-react";
import type { Trip } from "@/types";

export function TravelDocumentsPanel({ trip }: { trip: Trip }) {
  const destination = encodeURIComponent(trip.destination_city);
  return <aside className="gt-docs-panel"><h3>Antes de viajar: documentação e saúde</h3><p>As exigências dependem da nacionalidade, do itinerário e das regras vigentes. Confirme os requisitos oficiais para <strong>{trip.destination_city}</strong> antes de comprar a viagem.</p><ul><li>Verifique passaporte, visto e prazo de permanência para a sua nacionalidade.</li><li>Confira vacinas, certificado internacional e recomendações sanitárias.</li><li>Considere seguro viagem e leve documentos e medicamentos essenciais na bagagem de mão.</li></ul><div><a href={`https://www.google.com/search?q=${destination}+site%3Agov.br%2Fmre+visto+brasileiros`} target="_blank" rel="noopener noreferrer">Consultar orientações do Itamaraty <ExternalLink size={13} /></a><a href="https://www.gov.br/anvisa/pt-br/assuntos/paf/certificado-internacional-de-vacinacao" target="_blank" rel="noopener noreferrer">Consultar Anvisa / vacinação <ExternalLink size={13} /></a></div><small>O GarimpaTrip não substitui a confirmação com consulados, companhias aéreas ou autoridades sanitárias.</small></aside>;
}
