using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veterinaria.Application.DTOs;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Entities;
using Veterinaria.Web.Models.Dto;

namespace Veterinaria.Web.Controllers;

[Authorize(Roles = "Admin,Recepcionista,Veterinario")]
[ApiController]
[Route("api/[controller]")]
public class ProductosController : ControllerBase
{
    private readonly IProductoService _productoService;
    private readonly IMapper _mapper;

    public ProductosController(IProductoService productoService, IMapper mapper)
    {
        _productoService = productoService;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<Response<object>>> Index([FromQuery] string? q, [FromQuery] string? categoria, [FromQuery] int page = 1)
    {
        var query = _productoService.GetActiveProductosQuery();

        if (!string.IsNullOrWhiteSpace(q))
        {
            q = q.ToLower();
            query = query.Where(p => p.Nombre.ToLower().Contains(q) || (p.Descripcion != null && p.Descripcion.ToLower().Contains(q)));
        }

        if (!string.IsNullOrWhiteSpace(categoria))
        {
            query = query.Where(p => p.Categoria == categoria);
        }

        var total = await query.CountAsync();
        var productos = await query.OrderBy(p => p.Nombre)
            .Skip((page - 1) * 10)
            .Take(10)
            .ToListAsync();

        var dtos = _mapper.Map<List<ProductoDto>>(productos);

        return Ok(Response<object>.Ok(new { Data = dtos, Total = total, Page = page, PageSize = 10 }));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Response<ProductoDto>>> Details(int id)
    {
        var producto = await _productoService.GetProductoByIdAsync(id);
        if (producto == null || !producto.Activo)
        {
            return NotFound(Response<ProductoDto>.Fail("Producto no encontrado."));
        }

        var dto = _mapper.Map<ProductoDto>(producto);
        return Ok(Response<ProductoDto>.Ok(dto));
    }

    [HttpGet("bajo-stock")]
    public async Task<ActionResult<Response<IEnumerable<ProductoDto>>>> GetBajoStock()
    {
        var productos = await _productoService.GetProductosBajoStockAsync();
        var dtos = _mapper.Map<List<ProductoDto>>(productos);
        return Ok(Response<IEnumerable<ProductoDto>>.Ok(dtos));
    }

    [HttpPost]
    public async Task<ActionResult<Response<ProductoDto>>> Create([FromBody] ProductoDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Response<ProductoDto>.Fail("Datos de producto inválidos."));
        }

        var producto = _mapper.Map<Producto>(dto);
        producto.Activo = true;
        producto.FechaCreacion = DateTime.UtcNow;

        await _productoService.AddProductoAsync(producto);

        var resultDto = _mapper.Map<ProductoDto>(producto);
        return Ok(Response<ProductoDto>.Ok(resultDto, "Producto creado exitosamente."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Response<object>>> Edit(int id, [FromBody] ProductoDto dto)
    {
        if (id != dto.Id)
        {
            return BadRequest(Response<object>.Fail("El ID no coincide."));
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(Response<object>.Fail("Datos inválidos."));
        }

        var producto = await _productoService.GetProductoByIdAsync(id);
        if (producto == null || !producto.Activo)
        {
            return NotFound(Response<object>.Fail("Producto no encontrado."));
        }

        _mapper.Map(dto, producto);
        await _productoService.UpdateProductoAsync(producto);

        return Ok(Response<object>.Ok("Producto actualizado exitosamente."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<Response<object>>> Delete(int id)
    {
        var producto = await _productoService.GetProductoByIdAsync(id);
        if (producto == null || !producto.Activo)
        {
            return NotFound(Response<object>.Fail("Producto no encontrado."));
        }

        await _productoService.DeleteProductoAsync(id);
        return Ok(Response<object>.Ok("Producto eliminado exitosamente."));
    }
}
