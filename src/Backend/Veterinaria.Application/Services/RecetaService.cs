using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class RecetaService : IRecetaService
{
    private readonly IUnitOfWork _unitOfWork;

    public RecetaService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Receta?> GetRecetaByIdAsync(int id)
    {
        return await _unitOfWork.Recetas.GetAll()
            .Include(r => r.Items)
                .ThenInclude(i => i.Producto)
            .Include(r => r.Mascota)
                .ThenInclude(m => m.Usuario)
            .Include(r => r.Veterinario)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<Receta?> GetRecetaByHistorialIdAsync(int historialId)
    {
        return await _unitOfWork.Recetas.GetAll()
            .Include(r => r.Items)
                .ThenInclude(i => i.Producto)
            .FirstOrDefaultAsync(r => r.HistorialClinicoId == historialId);
    }

    public async Task<Receta> CrearRecetaAsync(Receta receta)
    {
        receta.FechaEmision = DateTime.UtcNow;

        // T7 SHOULD: notas explícitas de stock insuficiente (visibles en caja/clínica).
        var avisosStock = new List<string>();

        if (receta.Items != null && receta.Items.Any())
        {
            var productoIds = receta.Items
                .Where(i => i.ProductoId.HasValue)
                .Select(i => i.ProductoId!.Value)
                .Distinct()
                .ToList();

            if (productoIds.Any())
            {
                var productosMap = await _unitOfWork.Productos.GetAll()
                    .Where(p => productoIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id);

                foreach (var item in receta.Items)
                {
                    if (item.ProductoId.HasValue && productosMap.TryGetValue(item.ProductoId.Value, out var prod))
                    {
                        item.NombreProducto = prod.Nombre;
                        item.RequiereRecetaObligatoria = prod.RequiereReceta;

                        // T7 SHOULD: si se pidió stock interno pero no alcanza, degradar a
                        // compra externa CON nota explícita (antes era silencioso).
                        if (item.EsStockInterno && prod.Stock < item.CantidadPrescrita)
                        {
                            item.EsStockInterno = false; // Mark for external purchase
                            avisosStock.Add($"[Stock] {prod.Nombre}: solicitada {item.CantidadPrescrita}, disponible {prod.Stock} → compra externa");
                        }
                    }
                }
            }
        }

        // T7 SHOULD: anexar avisos sin sobrescribir la indicación médica existente (max 1000).
        if (avisosStock.Any())
        {
            var notaStock = string.Join(" | ", avisosStock);
            var baseTexto = receta.IndicacionesGenerales?.Trim();
            var combinado = string.IsNullOrWhiteSpace(baseTexto)
                ? notaStock
                : $"{baseTexto} | {notaStock}";
            receta.IndicacionesGenerales = combinado.Length > 1000 ? combinado.Substring(0, 1000) : combinado;
        }

        await _unitOfWork.Recetas.AddAsync(receta);
        await _unitOfWork.CommitAsync();

        return receta;
    }

    public async Task<Dictionary<int, int>> ObtenerStockDisponibleProductosAsync(List<int> productoIds)
    {
        if (productoIds == null || !productoIds.Any())
            return new Dictionary<int, int>();

        return await _unitOfWork.Productos.GetAll()
            .Where(p => productoIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.Stock);
    }
}
