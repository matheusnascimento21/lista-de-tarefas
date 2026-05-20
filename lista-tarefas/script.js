// Pegamos todos os elementos que vamos precisar manipular
const inputNome       = document.getElementById('input-nome');
const inputPrioridade = document.getElementById('input-prioridade');
const inputData       = document.getElementById('input-data');
const inputPrazo      = document.getElementById('input-prazo');
const btnAdicionar    = document.getElementById('btn-adicionar');
const listaTarefas    = document.getElementById('lista-tarefas');

// Contadores do topo
const elTotal         = document.getElementById('total');
const elConcluidas    = document.getElementById('total-concluidas');
const elAtrasadas     = document.getElementById('total-atrasadas');

// Data de hoje no cabeçalho
const elDataHoje      = document.getElementById('data-hoje');

// Array onde todas as tarefas ficam armazenadas
let tarefas = JSON.parse(localStorage.getItem('tarefas') || '[]');

// Qual filtro está ativo no momento
let filtroAtivo = 'todas';

function mostrarDataHoje() {
  const hoje = new Date();
  const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  elDataHoje.textContent = hoje.toLocaleDateString('pt-BR', opcoes);
}

mostrarDataHoje();

function dataHojeFormatada() {
  // Retorna a data no formato AAAA-MM-DD que o input[type=date] usa
  return new Date().toISOString().split('T')[0];
}

// Preenche o campo "data da tarefa" com hoje por padrão
inputData.value = dataHojeFormatada();

function salvar() {
  // Converte o array para texto e salva no navegador
  localStorage.setItem('tarefas', JSON.stringify(tarefas));
  // Redesenha a lista na tela
  renderizar();
}

function adicionarTarefa() {
  const nome = inputNome.value.trim();

  // Se o campo estiver vazio, foca nele e para
  if (!nome) {
    inputNome.focus();
    return;
  }

  // Cria o objeto da nova tarefa
  const novaTarefa = {
    id:         Date.now(),        // ID único baseado no tempo atual
    nome:       nome,
    prioridade: inputPrioridade.value,
    data:       inputData.value || dataHojeFormatada(),
    prazo:      inputPrazo.value,  // pode ser vazio
    concluida:  false
  };

  // Adiciona no início do array (aparece no topo da lista)
  tarefas.unshift(novaTarefa);

  // Limpa os campos do formulário
  inputNome.value  = '';
  inputPrazo.value = '';
  inputData.value  = dataHojeFormatada();

  salvar();
}

// Clique no botão adicionar
btnAdicionar.addEventListener('click', adicionarTarefa);

// Pressionar Enter no campo de nome também adiciona
inputNome.addEventListener('keydown', function(evento) {
  if (evento.key === 'Enter') adicionarTarefa();
});

// Verifica se a tarefa está atrasada
function estaAtrasada(tarefa) {
  if (!tarefa.prazo || tarefa.concluida) return false;
  return tarefa.prazo < dataHojeFormatada();
}

// Calcula quantos dias faltam para o prazo
function diasRestantes(prazo) {
  if (!prazo) return null;
  const hoje    = new Date(dataHojeFormatada() + 'T00:00:00');
  const vence   = new Date(prazo + 'T00:00:00');
  const diff    = Math.round((vence - hoje) / (1000 * 60 * 60 * 24));
  return diff;
}

// Formata AAAA-MM-DD para DD/MM/AAAA
function formatarData(data) {
  if (!data) return '';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function criarCardHTML(tarefa) {
  const atrasada  = estaAtrasada(tarefa);
  const dias      = diasRestantes(tarefa.prazo);

  // Monta o texto e a classe do prazo
  let textoPrazo  = '';
  let classePrazo = 'data-info';

  if (tarefa.prazo) {
    if (dias < 0) {
      textoPrazo  = `Atrasado ${Math.abs(dias)} dia(s)`;
      classePrazo = 'data-info atrasou';
    } else if (dias === 0) {
      textoPrazo  = 'Vence hoje';
      classePrazo = 'data-info perto';
    } else if (dias <= 2) {
      textoPrazo  = `${dias} dia(s) restante(s)`;
      classePrazo = 'data-info perto';
    } else {
      textoPrazo  = `até ${formatarData(tarefa.prazo)}`;
    }
  }

  // Monta as classes do card
  const classesCard = [
    'card',
    tarefa.concluida ? 'concluida' : '',
    atrasada ? 'atrasada' : ''
  ].join(' ').trim();

  // Retorna o HTML completo do card
  return `
    <li class="${classesCard}" data-id="${tarefa.id}">
      <input
        type="checkbox"
        ${tarefa.concluida ? 'checked' : ''}
        data-acao="concluir"
      />
      <div class="corpo-card">
        <p class="nome-tarefa">${tarefa.nome}</p>
        <div class="meta">
          <span class="badge ${tarefa.prioridade}">
            ${tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
          </span>
          ${tarefa.data ? `<span class="data-info">📅 ${formatarData(tarefa.data)}</span>` : ''}
          ${tarefa.prazo ? `<span class="${classePrazo}">⏰ ${textoPrazo}</span>` : ''}
        </div>
      </div>
      <button class="btn-deletar" data-acao="deletar" title="Excluir">✕</button>
    </li>
  `;
}

function renderizar() {
  // Atualiza os contadores
  elTotal.textContent      = tarefas.length;
  elConcluidas.textContent = tarefas.filter(t => t.concluida).length;
  elAtrasadas.textContent  = tarefas.filter(t => estaAtrasada(t)).length;

  // Filtra o array conforme o filtro ativo
  let visiveis = tarefas;
  if (filtroAtivo === 'pendentes')  visiveis = tarefas.filter(t => !t.concluida);
  if (filtroAtivo === 'concluidas') visiveis = tarefas.filter(t => t.concluida);
  if (filtroAtivo === 'atrasadas')  visiveis = tarefas.filter(t => estaAtrasada(t));

  // Lista vazia
  if (!visiveis.length) {
    listaTarefas.innerHTML = '<p class="vazio">Nenhuma tarefa aqui.</p>';
    return;
  }

  // Monta o HTML de todos os cards e insere na página
  listaTarefas.innerHTML = visiveis.map(criarCardHTML).join('');
}

// Usamos um único listener na lista inteira em vez de um por card
listaTarefas.addEventListener('click', function(evento) {
  // Sobe pelo DOM até achar um elemento com data-acao
  const alvo = evento.target.closest('[data-acao]');
  if (!alvo) return;

  // Pega o id da tarefa a partir do card pai
  const card = alvo.closest('[data-id]');
  const id   = Number(card.dataset.id);
  const acao = alvo.dataset.acao;

  if (acao === 'concluir') {
    // Inverte o estado concluída/pendente
    const tarefa = tarefas.find(t => t.id === id);
    tarefa.concluida = !tarefa.concluida;
    salvar();
  }

  if (acao === 'deletar') {
    tarefas = tarefas.filter(t => t.id !== id);
    salvar();
  }
});

const botoesFiltro = document.querySelectorAll('.filtro');

botoesFiltro.forEach(function(botao) {
  botao.addEventListener('click', function() {
    // Remove a classe ativo de todos
    botoesFiltro.forEach(b => b.classList.remove('ativo'));
    // Adiciona no clicado
    botao.classList.add('ativo');
    // Atualiza o filtro e redesenha
    filtroAtivo = botao.dataset.filtro;
    renderizar();
  });
});

// Essa linha roda tudo quando a página carrega
renderizar();