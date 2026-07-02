-- Adiciona o estágio "Negociando" ao ciclo de vendas do veículo
ALTER TYPE "StatusVeiculo" ADD VALUE 'NEGOCIANDO' BEFORE 'DISPONIVEL';
