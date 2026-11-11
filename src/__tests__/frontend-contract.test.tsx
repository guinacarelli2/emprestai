import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, test, vi } from "vitest";
import { LoginScreen } from "@/components/screens/login";
import { OperacoesScreen } from "@/components/screens/operacoes";
import { CatalogoScreen } from "@/components/screens/catalogo";
import { CadastroScreen } from "@/components/screens/cadastro";
import { DetalheScreen } from "@/components/screens/detalhe";
import { ReturnLoan } from "@/components/ui/return-loan";
import { EquipmentPhoto } from "@/components/ui/equipment-photo";
import type { Equipment } from "@/lib/types";

// Contratos de componente com hooks tRPC mockados. Não são integração nem E2E.
const state = vi.hoisted(() => ({
  role: "colaborador",
  count: 0,
  overdue: false,
  error: null as null | { message: string },
  pending: false,
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  invalidate: vi.fn(),
  mutate: vi.fn(),
  save: vi.fn(),
  list: vi.fn(),
  operationsList: vi.fn(),
  operationsStats: vi.fn(),
  nextOperationsPage: vi.fn(),
  sessionError: null as null | { message: string; data: { code: string } },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: state.push, replace: state.replace, refresh: state.refresh }),
  usePathname: () => "/catalogo",
}));
const item = {
  id: "00000000-0000-4000-8000-000000000001",
  nome: "Notebook 14 polegadas",
  categoria: "notebook",
  patrimonio: "TI-0001",
  situacao: "disponivel",
  local: "Balcão",
  observacoes: null,
  numeroSerie: null,
  imageUrl: null,
  photoSource: null,
  photoPage: null,
  photographer: null,
  photographerUrl: null,
  licenseName: null,
  licenseUrl: null,
  createdAt: new Date("2026-11-10T12:00:00Z"),
  history: [],
};
vi.mock("@/lib/trpc", () => ({
  api: {
    useUtils: () => ({ invalidate: state.invalidate }),
    auth: {
      me: {
        useQuery: () => ({
          data: {
            user: { id: "user", email: "teste@example.org", name: "Pessoa de teste" },
            role: state.role,
            openCount: state.count,
            overdue: state.overdue,
            dueDate: "2026-11-24",
          },
          isPending: false,
          error: state.sessionError,
          refetch: vi.fn(),
        }),
      },
      login: { useMutation: () => ({ mutate: state.mutate, error: state.error, isPending: state.pending }) },
      logout: { useMutation: () => ({ mutate: state.mutate, error: null, isPending: false }) },
    },
    equipment: {
      list: {
        useInfiniteQuery: (input: unknown) => {
          state.list(input);
          return {
            data: { pages: [{ items: [], total: 0, available: 0 }] },
            error: null,
            isPending: false,
            refetch: vi.fn(),
          };
        },
      },
      get: { useQuery: () => ({ data: item, error: null, isPending: false }) },
      recent: { useQuery: () => ({ data: [], isPending: false, error: null }) },
      create: {
        useMutation: () => ({ mutateAsync: state.save, isPending: state.pending, error: state.error }),
      },
    },
    operations: {
      list: {
        useInfiniteQuery: (input: unknown, options: unknown) => {
          state.operationsList(input, options);
          return {
            data: { pages: [{ items: [], nextCursor: "next-cursor" }] },
            error: null,
            isPending: false,
            refetch: vi.fn(),
            hasNextPage: true,
            isFetchingNextPage: false,
            fetchNextPage: state.nextOperationsPage,
          };
        },
      },
      stats: {
        useQuery: (input: unknown, options: unknown) => {
          state.operationsStats(input, options);
          return {
            data: { open: 43, late: 11, dueSoon: 5, maintenance: 2 },
            error: null,
            isPending: false,
            refetch: vi.fn(),
          };
        },
      },
    },
    loans: {
      mine: { useInfiniteQuery: () => ({ data: { pages: [{ items: [] }] }, isPending: false, error: null }) },
      request: {
        useMutation: () => ({
          mutate: state.mutate,
          error: state.error,
          isPending: state.pending,
          reset: vi.fn(),
        }),
      },
      return: {
        useMutation: () => ({
          mutate: state.mutate,
          error: state.error,
          isPending: state.pending,
          reset: vi.fn(),
        }),
      },
    },
  },
}));
function mount(node: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {node}
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  state.role = "colaborador";
  state.count = 0;
  state.overdue = false;
  state.error = null;
  state.pending = false;
  state.sessionError = null;
  state.save.mockResolvedValue({ id: "created" });
});

test("test_ca_01_spec003_busca_categoria_disponibilidade_combinadas_sem_contagem_mock", async () => {
  mount(<CatalogoScreen />);
  await userEvent.type(screen.getByRole("textbox", { name: "Buscar" }), "TI-0001");
  await userEvent.click(screen.getByRole("button", { name: "Notebooks" }));
  await userEvent.click(screen.getByRole("button", { name: "Só disponíveis" }));
  expect(state.list).toHaveBeenLastCalledWith({
    search: "TI-0001",
    category: "notebook",
    onlyAvailable: true,
    limit: 12,
  });
  expect(screen.getByText("0 equipamentos · 0 disponíveis agora")).toBeInTheDocument();
  expect(screen.getByText(/Nenhum equipamento encontrado/)).toBeInTheDocument();
});
test("test_ca_01_spec004_login_erro_nao_navega_nem_simula_sucesso", async () => {
  state.error = { message: "Configuração indisponível." };
  mount(<LoginScreen />);
  await userEvent.type(screen.getByLabelText("E-mail"), "teste@example.org");
  await userEvent.type(screen.getByLabelText("Senha"), "senha-apenas-fixture");
  await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
  await waitFor(() =>
    expect(state.mutate).toHaveBeenCalledWith({
      email: "teste@example.org",
      password: "senha-apenas-fixture",
    }),
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Configuração indisponível.");
  expect(state.push).not.toHaveBeenCalled();
});
test("test_ca_09_spec005_grupo_ops_oculto_para_colaborador_sem_sino_falso", () => {
  mount(<CatalogoScreen />);
  const nav = screen.getByRole("navigation", { name: "Principal" });
  expect(within(nav).queryByText("Operações")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Notificações" })).not.toBeInTheDocument();
});
test("test_ca_09_spec005_grupo_ops_visivel_somente_papel_servidor", () => {
  state.role = "operacoes";
  mount(<CatalogoScreen />);
  expect(screen.getByRole("link", { name: "Cadastrar equipamento" })).toBeInTheDocument();
});
test("test_ca_07_spec003_erro_pedido_mantem_modal_e_nao_afirma_sucesso", async () => {
  state.error = { message: "Equipamento já emprestado." };
  mount(<DetalheScreen patrimonio="TI-0001" />);
  await userEvent.click(screen.getByRole("button", { name: "Solicitar empréstimo" }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText(/24\/nov/)).toBeInTheDocument();
  await userEvent.click(within(dialog).getByRole("button", { name: "Confirmar" }));
  expect(state.mutate).toHaveBeenCalledWith({ equipmentId: item.id });
  expect(within(dialog).getByRole("alert")).toHaveTextContent("Equipamento já emprestado.");
  expect(screen.queryByText(/Empréstimo confirmado/)).not.toBeInTheDocument();
});
test("test_ca_03_spec003_atraso_bloqueia_com_motivo_explicito", () => {
  state.overdue = true;
  mount(<DetalheScreen patrimonio="TI-0001" />);
  expect(screen.getByRole("button", { name: "Solicitar empréstimo" })).toBeDisabled();
  expect(screen.getByText(/Bloqueado por atraso/)).toBeInTheDocument();
});
test("test_ca_03_spec005_devolucao_exige_confirmar_e_erro_nao_oculta_acao", async () => {
  state.error = { message: "Não foi possível devolver." };
  mount(<ReturnLoan loanId="loan-fixture" name="Notebook 14 polegadas" />);
  await userEvent.click(screen.getByRole("button", { name: "Devolver" }));
  expect(state.mutate).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Confirmar devolução" }));
  expect(state.mutate).toHaveBeenCalledWith({ loanId: "loan-fixture" });
  expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível devolver.");
  expect(screen.queryByRole("button", { name: "Devolvido" })).not.toBeInTheDocument();
});
async function fillEquipment() {
  await userEvent.type(screen.getByLabelText("Nome"), "Monitor 24 polegadas");
  await userEvent.type(screen.getByLabelText("Patrimônio"), "TI-0013");
  await userEvent.type(screen.getByLabelText("Local de retirada"), "Balcão");
}
test("test_ca_07_spec005_cadastrar_adicionar_outro_grava_antes_de_limpar", async () => {
  state.role = "operacoes";
  mount(<CadastroScreen />);
  await fillEquipment();
  await userEvent.click(screen.getByRole("button", { name: "Cadastrar e adicionar outro" }));
  await waitFor(() =>
    expect(state.save).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: "Monitor 24 polegadas",
        patrimonio: "TI-0013",
        situacao: "disponivel",
      }),
    ),
  );
  await waitFor(() => expect(screen.getByLabelText("Nome")).toHaveValue(""));
  expect(screen.getByText("Equipamento TI-0013 cadastrado.")).toBeInTheDocument();
  expect(state.invalidate).toHaveBeenCalled();
});
test("test_ca_07_spec005_erro_adicionar_outro_preserva_valores", async () => {
  state.role = "operacoes";
  state.save.mockRejectedValue(new Error("Patrimônio duplicado."));
  state.error = { message: "Patrimônio duplicado." };
  mount(<CadastroScreen />);
  await fillEquipment();
  await userEvent.click(screen.getByRole("button", { name: "Cadastrar e adicionar outro" }));
  await waitFor(() => expect(state.save).toHaveBeenCalled());
  expect(screen.getByLabelText("Nome")).toHaveValue("Monitor 24 polegadas");
  expect(screen.getByLabelText("Patrimônio")).toHaveValue("TI-0013");
  expect(screen.getByRole("alert")).toHaveTextContent("Patrimônio duplicado.");
  expect(screen.queryByText("Equipamento TI-0013 cadastrado.")).not.toBeInTheDocument();
});
test("test_ca_07_spec005_cadastrar_simples_persiste_sem_limpar", async () => {
  state.role = "operacoes";
  mount(<CadastroScreen />);
  await fillEquipment();
  await userEvent.click(screen.getByRole("button", { name: /^Cadastrar$/ }));
  await waitFor(() => expect(state.save).toHaveBeenCalled());
  expect(screen.getByLabelText("Nome")).toHaveValue("Monitor 24 polegadas");
});
test("test_ca_01_spec004_sessao_expirada_redireciona_sem_dados_protegidos", () => {
  state.sessionError = { message: "Sessão expirada.", data: { code: "UNAUTHORIZED" } };
  mount(<CatalogoScreen />);
  expect(state.replace).toHaveBeenCalledWith("/login");
  expect(screen.queryByRole("navigation", { name: "Principal" })).not.toBeInTheDocument();
});
test("test_ca_10_spec003_sem_foto_nao_inventa_imagem", () => {
  mount(<EquipmentPhoto item={item as Equipment} />);
  expect(screen.getByText("Foto ainda não disponibilizada.")).toBeInTheDocument();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

test("test_ca_07_spec005_envio_pendente_desabilita_ambos_cadastros", () => {
  state.role = "operacoes";
  state.pending = true;
  mount(<CadastroScreen />);
  expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Cadastrar e adicionar outro" })).toBeDisabled();
});
test("test_ca_03_spec005_cancelar_devolucao_nao_grava", async () => {
  mount(<ReturnLoan loanId="loan-fixture" name="Notebook 14 polegadas" />);
  await userEvent.click(screen.getByRole("button", { name: "Devolver" }));
  await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(state.mutate).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
test("test_ca_10_spec003_foto_storage_dimensoes_credito_escapado_e_link_inseguro_rejeitado", () => {
  mount(
    <EquipmentPhoto
      item={{
        ...item,
        categoria: "notebook",
        situacao: "disponivel",
        imageUrl: "https://storage.example.org/storage/v1/object/public/equipment/TI-0001.jpg",
        photoSource: "Pixabay",
        photoPage: "https://pixabay.com/photos/test-123",
        photographer: "<script>fixture</script>",
        photographerUrl: "javascript:alert(1)",
      }}
    />,
  );
  const photo = screen.getByRole("img");
  expect(photo).toHaveAttribute("width", "800");
  expect(photo).toHaveAttribute("height", "600");
  expect(photo.className).toContain("aspect-[4/3]");
  expect(screen.getByRole("link", { name: "Pixabay" })).toHaveAttribute("rel", "noreferrer");
  expect(screen.getByText(/<script>fixture<\/script>/)).toBeInTheDocument();
  expect(document.querySelector("script")).toBeNull();
  expect(screen.queryByRole("link", { name: /fixture/ })).toBeNull();
});

test("test_ca_06_spec005_patrimonio_sem_hifen_rejeitado_sem_persistir", async () => {
  state.role = "operacoes";
  mount(<CadastroScreen />);
  await fillEquipment();
  await userEvent.clear(screen.getByLabelText("Patrimônio"));
  await userEvent.type(screen.getByLabelText("Patrimônio"), "TI0013");
  await userEvent.click(screen.getByRole("button", { name: /^Cadastrar$/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Use o formato TI-0000.");
  expect(state.save).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Patrimônio")).toHaveValue("TI0013");
});

test("test_ca_04_spec005_atraso_categoria_busca_independentes_com_cursor_e_kpis_globais", async () => {
  state.role = "operacoes";
  mount(<OperacoesScreen />);
  await userEvent.click(screen.getByRole("button", { name: "Em atraso" }));
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Categoria" }), "notebook");
  await userEvent.type(screen.getByRole("textbox", { name: "Buscar" }), "TI-0001");
  expect(state.operationsList).toHaveBeenLastCalledWith(
    { search: "TI-0001", filter: "late", category: "notebook", limit: 20 },
    expect.objectContaining({ enabled: true, getNextPageParam: expect.any(Function) }),
  );
  const options = state.operationsList.mock.lastCall![1];
  expect(options.getNextPageParam({ nextCursor: "next-cursor" })).toBe("next-cursor");
  expect(options.getNextPageParam({ nextCursor: null })).toBeUndefined();
  await userEvent.click(screen.getByRole("button", { name: "Carregar mais empréstimos" }));
  expect(state.nextOperationsPage).toHaveBeenCalledOnce();
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Categoria" }), "monitor");
  expect(state.operationsList).toHaveBeenLastCalledWith(
    { search: "TI-0001", filter: "late", category: "monitor", limit: 20 },
    expect.any(Object),
  );
  expect(screen.getByRole("button", { name: "Em atraso" })).toHaveAttribute("aria-pressed", "true");
  expect(
    state.operationsStats.mock.calls.every(
      ([input, options]) => input === undefined && options.enabled === true,
    ),
  ).toBe(true);
  for (const value of [43, 11, 5, 2]) expect(screen.getByText(String(value))).toBeInTheDocument();
  expect(screen.getByText(/Indicadores do tenant inteiro, independentes dos filtros/)).toBeInTheDocument();
});

test("test_ca_04_spec005_semana_todas_categorias_e_busca_preservam_dimensoes", async () => {
  state.role = "operacoes";
  mount(<OperacoesScreen />);
  const category = screen.getByRole("combobox", { name: "Categoria" });
  expect(
    within(category)
      .getAllByRole("option")
      .map((option) => option.textContent),
  ).toEqual(["Todas as categorias", "Notebooks", "Monitores", "Cabos", "Câmeras", "Projetores"]);
  await userEvent.selectOptions(category, "camera");
  await userEvent.type(screen.getByRole("textbox", { name: "Buscar" }), "Pessoa");
  await userEvent.click(screen.getByRole("button", { name: "Vencem esta semana" }));
  expect(state.operationsList).toHaveBeenLastCalledWith(
    { search: "Pessoa", filter: "soon", category: "camera", limit: 20 },
    expect.any(Object),
  );
  await userEvent.selectOptions(category, "");
  expect(state.operationsList).toHaveBeenLastCalledWith(
    { search: "Pessoa", filter: "soon", category: undefined, limit: 20 },
    expect.any(Object),
  );
  await userEvent.click(screen.getByRole("button", { name: "Todos" }));
  await userEvent.clear(screen.getByRole("textbox", { name: "Buscar" }));
  expect(state.operationsList).toHaveBeenLastCalledWith(
    { search: undefined, filter: "all", category: undefined, limit: 20 },
    expect.any(Object),
  );
});
