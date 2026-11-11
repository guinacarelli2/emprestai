import { addDays, formatDM } from "./dates";

/**
 * Dados mock da spec 001. Nada aqui grava em banco.
 * Trocar de persona = mudar `currentUserId`.
 */

export const MAX_ITEMS = 3;
export const LOAN_DAYS = 14;

/** "Hoje" do mock: 28/set/2026. */
export const MOCK_TODAY = new Date(2026, 8, 28);
export const returnByLabel = formatDM(addDays(MOCK_TODAY, LOAN_DAYS));

export type EquipmentState = "available" | "loaned" | "maintenance";
export type Category = "Notebooks" | "Monitores" | "Câmeras" | "Cabos" | "Projetores";

export const CATEGORIES: Category[] = ["Notebooks", "Monitores", "Câmeras", "Cabos", "Projetores"];

export type HistoryRow = { date: string; event: string; result: string; tone?: "ok" | "warn" };

export type Equipment = {
  patrimonio: string;
  name: string;
  category: Category;
  state: EquipmentState;
  footer: string;
  description: string;
  location: string;
  lastReturn: string;
  history: HistoryRow[];
};

export const equipment: Equipment[] = [
  {
    patrimonio: "PAT-1042",
    name: 'MacBook Pro 14"',
    category: "Notebooks",
    state: "available",
    footer: "Solicitar →",
    description: "Notebook corporativo para desenho e build local.",
    location: "Balcão 2º andar",
    lastReturn: "02/set",
    history: [
      { date: "02/set", event: "Devolução", result: "No prazo", tone: "ok" },
      { date: "19/ago", event: "Empréstimo", result: "14 dias" },
      { date: "05/ago", event: "Manutenção", result: "Concluída", tone: "warn" },
    ],
  },
  {
    patrimonio: "PAT-1188",
    name: "ThinkPad T14",
    category: "Notebooks",
    state: "loaned",
    footer: "Com Marina Alves · devolve 14/set",
    description: "Notebook para suporte e atendimento em campo.",
    location: "Balcão 2º andar",
    lastReturn: "21/ago",
    history: [
      { date: "31/ago", event: "Empréstimo", result: "14 dias" },
      { date: "21/ago", event: "Devolução", result: "No prazo", tone: "ok" },
      { date: "07/ago", event: "Empréstimo", result: "14 dias" },
    ],
  },
  {
    patrimonio: "PAT-0871",
    name: 'Dell UltraSharp 27"',
    category: "Monitores",
    state: "available",
    footer: "Solicitar →",
    description: "Monitor de 27 polegadas para revisão de design.",
    location: "Balcão 2º andar",
    lastReturn: "11/set",
    history: [
      { date: "11/set", event: "Devolução", result: "No prazo", tone: "ok" },
      { date: "28/ago", event: "Empréstimo", result: "14 dias" },
      { date: "14/ago", event: "Devolução", result: "Atraso", tone: "warn" },
    ],
  },
  {
    patrimonio: "PAT-0233",
    name: "Sony A7 III",
    category: "Câmeras",
    state: "loaned",
    footer: "Com Rafael Lima · devolve 05/out",
    description: "Câmera mirrorless para foto e vídeo institucional.",
    location: "Balcão 2º andar",
    lastReturn: "10/set",
    history: [
      { date: "21/set", event: "Empréstimo", result: "14 dias" },
      { date: "10/set", event: "Devolução", result: "No prazo", tone: "ok" },
      { date: "27/ago", event: "Empréstimo", result: "14 dias" },
    ],
  },
  {
    patrimonio: "PAT-0455",
    name: "Dock USB-C Anker",
    category: "Cabos",
    state: "maintenance",
    footer: "Na assistência · peça",
    description: "Dock USB-C com HDMI, rede e portas USB.",
    location: "Assistência técnica",
    lastReturn: "19/ago",
    history: [
      { date: "22/set", event: "Manutenção", result: "Em andamento", tone: "warn" },
      { date: "19/ago", event: "Devolução", result: "Atraso", tone: "warn" },
      { date: "01/ago", event: "Empréstimo", result: "14 dias" },
    ],
  },
  {
    patrimonio: "PAT-0102",
    name: "Projetor Epson X49",
    category: "Projetores",
    state: "maintenance",
    footer: "Na assistência · peça",
    description: "Projetor para salas de reunião e treinamentos.",
    location: "Assistência técnica",
    lastReturn: "30/ago",
    history: [
      { date: "18/set", event: "Manutenção", result: "Em andamento", tone: "warn" },
      { date: "30/ago", event: "Devolução", result: "No prazo", tone: "ok" },
      { date: "16/ago", event: "Empréstimo", result: "14 dias" },
    ],
  },
];

export function findEquipment(patrimonio: string) {
  return equipment.find((e) => e.patrimonio.toLowerCase() === patrimonio.toLowerCase());
}

/* ---------- pessoas ---------- */

export type Loan = {
  patrimonio: string;
  name: string;
  category: Category;
  due: string;
  elapsedDays: number;
  overdue: boolean;
};

export type PastLoan = { name: string; pickedUp: string; returnedOn: string; late: boolean };

export type Person = {
  id: string;
  name: string;
  area: string;
  initials: string;
  loans: Loan[];
  history: PastLoan[];
};

export const people: Record<string, Person> = {
  marina: {
    id: "marina",
    name: "Marina Alves",
    area: "Design",
    initials: "MA",
    loans: [
      { patrimonio: "PAT-1188", name: "ThinkPad T14", category: "Notebooks", due: "14/set", elapsedDays: 7, overdue: false },
      { patrimonio: "PAT-0910", name: 'LG UltraFine 24"', category: "Monitores", due: "20/set", elapsedDays: 4, overdue: false },
    ],
    history: [
      { name: 'MacBook Air 13" M2', pickedUp: "20/ago", returnedOn: "02/set", late: false },
      { name: "Dock USB-C Anker", pickedUp: "01/ago", returnedOn: "19/ago", late: true },
    ],
  },
  camila: {
    id: "camila",
    name: "Camila Duarte",
    area: "Mkt",
    initials: "CD",
    loans: [
      { patrimonio: "PAT-0338", name: "Adaptador HDMI Belkin", category: "Cabos", due: "21/set", elapsedDays: 14, overdue: true },
    ],
    history: [{ name: 'Dell UltraSharp 27"', pickedUp: "02/ago", returnedOn: "15/ago", late: false }],
  },
};

/** Persona ativa. Trocar para "camila" mostra o estado de atraso (CA-10). */
export const currentUserId = "marina";

export function getUser(id: string = currentUserId): Person {
  return people[id] ?? people.marina;
}

export function requestStatus(user: Person): { allowed: boolean; reason: "overdue" | "limit" | null } {
  if (user.loans.some((l) => l.overdue)) return { allowed: false, reason: "overdue" };
  if (user.loans.length >= MAX_ITEMS) return { allowed: false, reason: "limit" };
  return { allowed: true, reason: null };
}

/* ---------- operações ---------- */

export type OpsLoan = { id: string; person: string; area: string; item: string; pickedUp: string; due: string; overdue: boolean };

export const opsLoans: OpsLoan[] = [
  { id: "o1", person: "Marina Alves", area: "Design", item: "ThinkPad T14", pickedUp: "31/ago", due: "14/set", overdue: false },
  { id: "o2", person: "Rafael Lima", area: "Eng", item: "Sony A7 III", pickedUp: "21/set", due: "05/out", overdue: false },
  { id: "o3", person: "Camila Duarte", area: "Mkt", item: 'MacBook Pro 14"', pickedUp: "07/set", due: "21/set", overdue: true },
  { id: "o4", person: "Tiago Menezes", area: "Suporte", item: 'Dell UltraSharp 27"', pickedUp: "04/set", due: "18/set", overdue: true },
  { id: "o5", person: "Ana Sato", area: "Financeiro", item: 'LG UltraFine 24"', pickedUp: "18/set", due: "02/out", overdue: false },
  { id: "o6", person: "Bruno Kato", area: "Eng", item: "Dock USB-C Anker", pickedUp: "19/set", due: "03/out", overdue: false },
  { id: "o7", person: "Helena Prado", area: "Comercial", item: 'MacBook Air 13" M2', pickedUp: "03/set", due: "17/set", overdue: true },
];

export const opsStats = { open: 21, dueSoon: 4, overdue: 3, maintenance: 2 };

export const recentRegistrations = [
  { item: 'MacBook Air 13" M2', date: "26/set" },
  { item: "Projetor Epson X49", date: "25/set" },
  { item: "Dock USB-C Anker", date: "24/set" },
];
