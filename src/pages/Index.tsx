
import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, isSameMonth, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, EyeOff, Plus, DollarSign, Package, Clock, AlertTriangle, CheckCircle, Timer, Phone, TrendingUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface Pedido {
  id: string;
  cliente: string;
  whatsapp: string;
  descricao: string;
  valor: number;
  status: 'Pendente' | 'Urgente' | 'Finalizado';
  dataCriacao: string;
}

const Index = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mostrarValor, setMostrarValor] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Estados do formulário
  const [cliente, setCliente] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState<'Pendente' | 'Urgente' | 'Finalizado'>('Pendente');

  // Opções pré-definidas para descrição com valores
  const opcoesProdutos = [
    { nome: 'FLYER ESTÁTICO', valor: 70 },
    { nome: 'VÍDEO "REELS" 15 SEG.', valor: 110 },
    { nome: 'VÍDEO "REELS" 30 SEG.', valor: 130 },
    { nome: 'VÍDEO "REELS" 15 SEG. + FLYER FEED/STORIES', valor: 150 },
    { nome: 'VÍDEO "REELS" 30 SEG. + FLYER FEED/STORIES', valor: 170 },
    { nome: 'LOGOTIPO', valor: 230 },
    { nome: 'CARROSEL PRA FEED', valor: 110 },
    { nome: 'Outros', valor: 0 }
  ];

  // Atualizar tempo atual a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Verificar pedidos que devem ser movidos para urgente automaticamente
  useEffect(() => {
    setPedidos(prev => 
      prev.map(pedido => {
        if (pedido.status === 'Pendente') {
          const criacao = parseISO(pedido.dataCriacao);
          const prazoFinal = new Date(criacao.getTime() + (48 * 60 * 60 * 1000));
          const horasRestantes = differenceInHours(prazoFinal, currentTime);
          
          if (horasRestantes < 6 && horasRestantes >= 0) {
            return { ...pedido, status: 'Urgente' as const };
          }
        }
        return pedido;
      })
    );
  }, [currentTime]);

  // Estatísticas calculadas
  const totalPedidos = pedidos.length;
  const pedidosPendentes = pedidos.filter(p => p.status === 'Pendente').length;
  const pedidosUrgentes = pedidos.filter(p => p.status === 'Urgente').length;
  const valorTotal = pedidos.reduce((total, p) => total + p.valor, 0);

  // Dados para o gráfico de linha (últimos 7 dias)
  const gerarDadosGrafico = () => {
    const hoje = new Date();
    const dados = [];
    
    for (let i = 6; i >= 0; i--) {
      const data = new Date();
      data.setDate(hoje.getDate() - i);
      const dataStr = format(data, 'dd/MM');
      
      const pedidosDoDia = pedidos.filter(p => {
        const dataPedido = parseISO(p.dataCriacao);
        return format(dataPedido, 'dd/MM/yyyy') === format(data, 'dd/MM/yyyy');
      }).length;
      
      dados.push({
        data: dataStr,
        pedidos: pedidosDoDia
      });
    }
    
    return dados;
  };

  // Formatação automática do WhatsApp
  const formatarWhatsAppInput = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    
    if (apenasNumeros.length <= 2) {
      return `(${apenasNumeros}`;
    } else if (apenasNumeros.length <= 7) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
    } else {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`;
    }
  };

  // Formatação automática do valor
  const formatarValorInput = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    const numero = parseFloat(apenasNumeros) / 100;
    return numero.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  // Função para lidar com mudança da descrição
  const handleDescricaoChange = (novaDescricao: string) => {
    setDescricao(novaDescricao);
    
    // Encontrar o produto selecionado
    const produtoSelecionado = opcoesProdutos.find(p => p.nome === novaDescricao);
    
    if (produtoSelecionado && produtoSelecionado.valor > 0) {
      // Formatar o valor automaticamente
      setValor(produtoSelecionado.valor.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      }));
    } else if (novaDescricao === 'Outros') {
      // Limpar o valor para permitir digitação manual
      setValor('');
    }
  };

  const criarPedido = () => {
    if (!cliente || !whatsapp || !descricao || !valor) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    const valorNumerico = parseFloat(valor.replace(/\D/g, '')) / 100;

    const novoPedido: Pedido = {
      id: Date.now().toString(),
      cliente,
      whatsapp,
      descricao,
      valor: valorNumerico,
      status,
      dataCriacao: new Date().toISOString()
    };

    setPedidos(prev => [...prev, novoPedido]);
    
    // Limpar formulário
    setCliente('');
    setWhatsapp('');
    setDescricao('');
    setValor('');
    setStatus('Pendente');

    toast({
      title: "Pedido criado com sucesso!",
      description: `Pedido para ${cliente} foi adicionado ao sistema.`,
    });
  };

  const alterarStatus = (id: string, novoStatus: 'Pendente' | 'Urgente' | 'Finalizado') => {
    setPedidos(prev => 
      prev.map(p => p.id === id ? { ...p, status: novoStatus } : p)
    );
    
    toast({
      title: "Status atualizado",
      description: `Status alterado para ${novoStatus}.`,
    });
  };

  const getTempoRestante = (dataCriacao: string) => {
    const criacao = parseISO(dataCriacao);
    const agora = currentTime;
    const prazoFinal = new Date(criacao.getTime() + (48 * 60 * 60 * 1000));
    
    const horasRestantes = differenceInHours(prazoFinal, agora);
    const minutosRestantes = differenceInMinutes(prazoFinal, agora) % 60;
    const segundosRestantes = differenceInSeconds(prazoFinal, agora) % 60;
    
    if (horasRestantes < 0) {
      return { texto: "Prazo expirado", vencido: true };
    }
    
    if (horasRestantes < 1) {
      return { 
        texto: `${minutosRestantes}min ${segundosRestantes}s restantes`, 
        vencido: false,
        critico: true 
      };
    }
    
    return { 
      texto: `${horasRestantes}h ${minutosRestantes}min ${segundosRestantes}s restantes`, 
      vencido: false,
      critico: horasRestantes < 6 
    };
  };

  // Organizar pedidos por mês e status, com ordem de chegada
  const pedidosOrganizados = pedidos
    .sort((a, b) => {
      // Finalizados vão para o fim
      if (a.status === 'Finalizado' && b.status !== 'Finalizado') return 1;
      if (a.status !== 'Finalizado' && b.status === 'Finalizado') return -1;
      
      // Para pedidos não finalizados, ordenar por data de criação (mais antigo primeiro)
      if (a.status !== 'Finalizado' && b.status !== 'Finalizado') {
        return new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime();
      }
      
      // Para finalizados, ordenar por data de criação (mais recente primeiro)
      return new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime();
    })
    .reduce((acc, pedido) => {
      const mesAno = format(parseISO(pedido.dataCriacao), 'MMMM yyyy', { locale: ptBR });
      if (!acc[mesAno]) acc[mesAno] = [];
      acc[mesAno].push(pedido);
      return acc;
    }, {} as Record<string, Pedido[]>);

  const formatarWhatsApp = (numero: string) => {
    const apenasNumeros = numero.replace(/\D/g, '');
    
    if (apenasNumeros.length === 11) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
    }
    return numero;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendente': 
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-full border border-yellow-500/40 font-semibold">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-sm">Pendente</span>
          </div>
        );
      case 'Urgente': 
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/30 text-red-300 rounded-full border border-red-500/60 font-bold">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm">URGENTE</span>
          </div>
        );
      case 'Finalizado': 
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-full border border-green-500/40 font-semibold">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm">Finalizado</span>
          </div>
        );
      default: return null;
    }
  };

  const chartConfig = {
    pedidos: {
      label: "Pedidos",
      color: "#ffffff",
    },
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(64, 64, 64, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(64, 64, 64, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Header */}
      <div className="relative bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
              Sistema de Pedidos
            </h1>
            <p className="text-gray-400 mt-2 font-medium">Gerencie seus pedidos de forma profissional e eficiente</p>
          </div>
          <div className="text-right bg-gray-800/50 rounded-xl px-6 py-3 border border-gray-600/50 backdrop-blur-sm">
            <div className="text-white text-xl font-bold font-mono">
              {format(currentTime, "HH:mm:ss", { locale: ptBR })}
            </div>
            <div className="text-gray-300 text-sm font-medium">
              {format(currentTime, "EEEE, dd/MM/yyyy", { locale: ptBR })}
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto p-6 space-y-8">
        {/* Formulário de Criação */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl p-8 border border-gray-600/30 shadow-2xl animate-fade-in">
          <h2 className="text-2xl font-bold mb-8 flex items-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-gray-500 to-gray-400 flex items-center justify-center mr-3">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Novo Pedido
          </h2>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="animate-slide-in-left space-y-3">
              <Label htmlFor="cliente" className="text-sm text-gray-300 font-semibold block">Cliente</Label>
              <Input
                id="cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="bg-gray-800/50 border-gray-600/50 text-white h-12 rounded-xl backdrop-blur-sm transition-all duration-300 focus:bg-gray-700/50 focus:border-gray-400/50 focus:ring-1 focus:ring-gray-400/30"
                placeholder="Digite o nome do cliente"
              />
            </div>
            
            <div className="animate-slide-in-right space-y-3">
              <Label htmlFor="whatsapp" className="text-sm text-gray-300 font-semibold block">WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                <Input
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatarWhatsAppInput(e.target.value))}
                  className="bg-gray-800/50 border-gray-600/50 text-white pl-12 h-12 rounded-xl backdrop-blur-sm transition-all duration-300 focus:bg-gray-700/50 focus:border-gray-400/50 focus:ring-1 focus:ring-gray-400/30"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="animate-slide-in-left space-y-3" style={{ animationDelay: '0.1s' }}>
              <Label className="text-sm text-gray-300 font-semibold block">Descrição do Pedido</Label>
              <Select value={descricao} onValueChange={handleDescricaoChange}>
                <SelectTrigger className="bg-gray-800/50 border-gray-600/50 text-white h-12 rounded-xl backdrop-blur-sm transition-all duration-300 hover:bg-gray-700/50 focus:border-gray-400/50 focus:ring-1 focus:ring-gray-400/30">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-gray-400" />
                    <SelectValue placeholder="Selecione o tipo de pedido" />
                    <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-gray-800/95 border-gray-600/50 backdrop-blur-xl rounded-xl">
                  {opcoesProdutos.map((produto) => (
                    <SelectItem key={produto.nome} value={produto.nome} className="text-white hover:bg-gray-700/50 rounded-lg">
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="animate-slide-in-right space-y-3" style={{ animationDelay: '0.1s' }}>
              <Label htmlFor="valor" className="text-sm text-gray-300 font-semibold block">Valor (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                <Input
                  id="valor"
                  value={valor}
                  onChange={(e) => {
                    if (descricao === 'Outros' || descricao === '') {
                      const valorFormatado = formatarValorInput(e.target.value);
                      setValor(valorFormatado);
                    }
                  }}
                  disabled={descricao !== 'Outros' && descricao !== ''}
                  className="bg-gray-800/50 border-gray-600/50 text-white pl-12 h-12 rounded-xl backdrop-blur-sm transition-all duration-300 focus:bg-gray-700/50 focus:border-gray-400/50 focus:ring-1 focus:ring-gray-400/30 disabled:opacity-70"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>
            
          <Button 
            onClick={criarPedido}
            className="w-full h-14 bg-gradient-to-r from-gray-600 to-white text-black font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.01] animate-scale-in rounded-xl border-0 hover:from-gray-700 hover:to-gray-100"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Novo Pedido
          </Button>
        </div>

        {/* Estatísticas e Gráfico */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Estatísticas */}
          <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-600/30 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 font-semibold">Total de Pedidos</p>
                  <p className="text-3xl font-bold text-white mt-1">{totalPedidos}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-gray-500 to-gray-400 flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-900/60 to-orange-900/60 backdrop-blur-xl rounded-2xl p-6 border border-amber-600/30 shadow-xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-200 font-semibold">Pendentes</p>
                  <p className="text-3xl font-bold text-white mt-1">{pedidosPendentes}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-900/60 to-rose-900/60 backdrop-blur-xl rounded-2xl p-6 border border-red-600/30 shadow-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-200 font-semibold">Urgentes</p>
                  <p className="text-3xl font-bold text-white mt-1">{pedidosUrgentes}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-700/60 to-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-600/30 shadow-xl animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 font-semibold">Valor Total</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {mostrarValor ? `R$ ${valorTotal.toFixed(2)}` : '••••••'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-gray-700/50 h-12 w-12 p-0 rounded-xl transition-all"
                  onClick={() => setMostrarValor(!mostrarValor)}
                >
                  {mostrarValor ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Gráfico de Linha */}
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-600/30 shadow-xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-gray-500 to-gray-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Pedidos (7 dias)</h3>
            </div>
            <ChartContainer config={chartConfig} className="h-32">
              <LineChart data={gerarDadosGrafico()}>
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="pedidos" 
                  stroke="url(#gradient)" 
                  strokeWidth={3}
                  dot={{ fill: '#9CA3AF', strokeWidth: 2, r: 5 }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#9CA3AF" />
                    <stop offset="100%" stopColor="#6B7280" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ChartContainer>
          </div>
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Lista de Pedidos</h2>
          
          {Object.entries(pedidosOrganizados).map(([mesAno, pedidosDoMes]) => (
            <div key={mesAno} className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-300 capitalize bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">{mesAno}</h3>
              
              <div className="grid gap-4">
                {pedidosDoMes.map((pedido, index) => {
                  const tempoInfo = getTempoRestante(pedido.dataCriacao);
                  const isUrgente = pedido.status === 'Urgente';
                  
                  return (
                    <div
                      key={pedido.id}
                      className={cn(
                        "bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 hover:bg-gray-700/60 animate-fade-in shadow-xl",
                        isUrgente 
                          ? "border border-red-500/60" 
                          : "border border-gray-600/30"
                      )}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 flex-wrap">
                            <h4 className="font-bold text-2xl text-white">{pedido.cliente}</h4>
                            {getStatusBadge(pedido.status)}
                            {pedido.status !== 'Finalizado' && (
                              <div className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold backdrop-blur-sm",
                                tempoInfo.vencido 
                                  ? "bg-red-900/50 text-red-300 border-red-500/50"
                                  : tempoInfo.critico
                                  ? "bg-orange-900/50 text-orange-300 border-orange-500/50"
                                  : "bg-gray-900/50 text-gray-300 border-gray-500/50"
                              )}>
                                <Timer className="w-4 h-4" />
                                <span className="font-mono">{tempoInfo.texto}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className="bg-gray-700/70 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-semibold border border-gray-600/50">
                              {pedido.descricao}
                            </span>
                            <a 
                              href={`https://wa.me/55${pedido.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 hover:scale-105 transform duration-200 shadow-lg"
                            >
                              <Phone className="w-4 h-4" />
                              {formatarWhatsApp(pedido.whatsapp)}
                            </a>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-400 font-medium">
                            <span className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              {mostrarValor ? `R$ ${pedido.valor.toFixed(2)}` : '••••••'}
                            </span>
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {format(parseISO(pedido.dataCriacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Select
                            value={pedido.status}
                            onValueChange={(value: 'Pendente' | 'Urgente' | 'Finalizado') => alterarStatus(pedido.id, value)}
                          >
                            <SelectTrigger className="w-40 bg-gray-800/70 border-gray-600/50 text-white h-12 rounded-xl backdrop-blur-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800/95 border-gray-600/50 backdrop-blur-xl rounded-xl">
                              <SelectItem value="Pendente" className="text-white hover:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center">
                                  <div className="w-3 h-3 bg-amber-500 rounded-full mr-3" />
                                  Pendente
                                </div>
                              </SelectItem>
                              <SelectItem value="Urgente" className="text-white hover:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center">
                                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3" />
                                  Urgente
                                </div>
                              </SelectItem>
                              <SelectItem value="Finalizado" className="text-white hover:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center">
                                  <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3" />
                                  Finalizado
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {pedidos.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-300 text-xl font-semibold mb-2">Nenhum pedido cadastrado ainda</p>
              <p className="text-gray-500">Crie seu primeiro pedido usando o formulário acima</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
