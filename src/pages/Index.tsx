
import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, EyeOff, Plus, Calendar, DollarSign, Package, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Pedido {
  id: string;
  cliente: string;
  descricao: string;
  dataEntrega: string;
  valor: number;
  status: 'Pendente' | 'Urgente' | 'Finalizado';
  dataCriacao: string;
}

const Index = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mostrarValor, setMostrarValor] = useState(true);
  const [progressoAtual, setProgressoAtual] = useState(0);
  
  // Estados do formulário
  const [cliente, setCliente] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataEntrega, setDataEntrega] = useState<Date>();
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState<'Pendente' | 'Urgente' | 'Finalizado'>('Pendente');

  // Animação da barra de progresso
  useEffect(() => {
    const interval = setInterval(() => {
      setProgressoAtual((prev) => (prev >= 100 ? 0 : prev + 0.5));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Estatísticas calculadas
  const totalPedidos = pedidos.length;
  const pedidosPendentes = pedidos.filter(p => p.status === 'Pendente').length;
  const pedidosUrgentes = pedidos.filter(p => p.status === 'Urgente').length;
  const valorTotal = pedidos.reduce((total, p) => total + p.valor, 0);

  const criarPedido = () => {
    if (!cliente || !descricao || !dataEntrega || !valor) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    const novoPedido: Pedido = {
      id: Date.now().toString(),
      cliente,
      descricao,
      dataEntrega: dataEntrega.toISOString(),
      valor: parseFloat(valor),
      status,
      dataCriacao: new Date().toISOString()
    };

    setPedidos(prev => [...prev, novoPedido]);
    
    // Limpar formulário
    setCliente('');
    setDescricao('');
    setDataEntrega(undefined);
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

  // Organizar pedidos por mês e status
  const pedidosOrganizados = pedidos
    .sort((a, b) => {
      // Finalizados vão para o fim
      if (a.status === 'Finalizado' && b.status !== 'Finalizado') return 1;
      if (a.status !== 'Finalizado' && b.status === 'Finalizado') return -1;
      // Ordenar por data de criação
      return new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime();
    })
    .reduce((acc, pedido) => {
      const mesAno = format(parseISO(pedido.dataCriacao), 'MMMM yyyy', { locale: ptBR });
      if (!acc[mesAno]) acc[mesAno] = [];
      acc[mesAno].push(pedido);
      return acc;
    }, {} as Record<string, Pedido[]>);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendente': 
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full border border-yellow-500/30">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-sm font-medium">Pendente</span>
          </div>
        );
      case 'Urgente': 
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-300 rounded-full border border-red-500/30">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-sm font-medium">Urgente</span>
          </div>
        );
      case 'Finalizado': 
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-300 rounded-full border border-green-500/30">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">Finalizado</span>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Sistema de Pedidos
            </h1>
            <p className="text-gray-400 mt-1">Gerencie seus pedidos de forma profissional e eficiente</p>
          </div>
          <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
              style={{ width: `${progressoAtual}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Formulário de Criação - Mais Compacto */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-green-400" />
            Criar Novo Pedido
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="cliente" className="text-sm text-gray-300">Cliente</Label>
              <Input
                id="cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                placeholder="Nome do cliente"
              />
            </div>
            
            <div>
              <Label className="text-sm text-gray-300">Data de Entrega</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600 mt-1",
                      !dataEntrega && "text-gray-400"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dataEntrega ? format(dataEntrega, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                  <CalendarComponent
                    mode="single"
                    selected={dataEntrega}
                    onSelect={setDataEntrega}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="descricao" className="text-sm text-gray-300">Descrição</Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                placeholder="Descrição do pedido"
              />
            </div>
            
            <div>
              <Label htmlFor="valor" className="text-sm text-gray-300">Valor</Label>
              <div className="relative mt-1">
                <Input
                  id="valor"
                  type="number"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white pr-10"
                  placeholder="0.00"
                  step="0.01"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0 text-gray-400 hover:text-white"
                  onClick={() => setMostrarValor(!mostrarValor)}
                >
                  {mostrarValor ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-gray-300">Status</Label>
              <Select value={status} onValueChange={(value: 'Pendente' | 'Urgente' | 'Finalizado') => setStatus(value)}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="Pendente" className="text-white">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                      Pendente
                    </div>
                  </SelectItem>
                  <SelectItem value="Urgente" className="text-white">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                      Urgente
                    </div>
                  </SelectItem>
                  <SelectItem value="Finalizado" className="text-white">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      Finalizado
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
            
          <Button 
            onClick={criarPedido}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Pedido
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl p-6 text-white border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300">Total de Pedidos</p>
                <p className="text-2xl font-bold">{totalPedidos}</p>
              </div>
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-xl p-6 text-white border border-yellow-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Pendentes</p>
                <p className="text-2xl font-bold">{pedidosPendentes}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-xl p-6 text-white border border-red-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100">Urgentes</p>
                <p className="text-2xl font-bold">{pedidosUrgentes}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-6 text-white border border-green-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Valor Total</p>
                <p className="text-2xl font-bold">
                  {mostrarValor ? `R$ ${valorTotal.toFixed(2)}` : '••••••'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-200" />
            </div>
          </div>
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Lista de Pedidos</h2>
          
          {Object.entries(pedidosOrganizados).map(([mesAno, pedidosDoMes]) => (
            <div key={mesAno} className="space-y-4">
              <h3 className="text-lg font-medium text-gray-300 capitalize">{mesAno}</h3>
              
              <div className="grid gap-4">
                {pedidosDoMes.map((pedido) => (
                  <div
                    key={pedido.id}
                    className={cn(
                      "bg-gray-800 rounded-xl p-4 transition-all duration-300 hover:bg-gray-750",
                      pedido.status === 'Urgente' 
                        ? "border-2 border-red-500/50 shadow-lg shadow-red-500/10" 
                        : "border border-gray-700"
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-lg">{pedido.cliente}</h4>
                          {getStatusBadge(pedido.status)}
                        </div>
                        <p className="text-gray-300">{pedido.descricao}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Entrega: {format(parseISO(pedido.dataEntrega), "dd/MM/yyyy", { locale: ptBR })}</span>
                          <span>Valor: {mostrarValor ? `R$ ${pedido.valor.toFixed(2)}` : '••••••'}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Select
                          value={pedido.status}
                          onValueChange={(value: 'Pendente' | 'Urgente' | 'Finalizado') => alterarStatus(pedido.id, value)}
                        >
                          <SelectTrigger className="w-36 bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="Pendente" className="text-white">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                                Pendente
                              </div>
                            </SelectItem>
                            <SelectItem value="Urgente" className="text-white">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                                Urgente
                              </div>
                            </SelectItem>
                            <SelectItem value="Finalizado" className="text-white">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                                Finalizado
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {pedidos.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Nenhum pedido cadastrado ainda</p>
              <p className="text-gray-500">Crie seu primeiro pedido usando o formulário acima</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
