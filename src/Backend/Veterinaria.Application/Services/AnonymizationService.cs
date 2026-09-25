using System;
using System.Text.Json;
using System.Threading.Tasks;
using Veterinaria.Application.Interfaces;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Application.Services;

public class AnonymizationService : IAnonymizationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditoriaService _auditoriaService;

    public AnonymizationService(IUnitOfWork unitOfWork, IAuditoriaService auditoriaService)
    {
        _unitOfWork = unitOfWork;
        _auditoriaService = auditoriaService;
    }

    public async Task<Usuario> AnonimizarClienteAsync(int clienteUsuarioId, int ejecutadoPorUsuarioId, string? ipAddress)
    {
        var cliente = await _unitOfWork.Usuarios.GetByIdAsync(clienteUsuarioId);
        if (cliente == null)
        {
            throw new InvalidOperationException($"Cliente con ID #{clienteUsuarioId} no encontrado.");
        }

        if (cliente.Rol != "Cliente")
        {
            throw new InvalidOperationException($"El usuario #{clienteUsuarioId} no tiene rol de Cliente y no puede ser anonimizado.");
        }

        if (cliente.EsAnonimizado)
        {
            return cliente; // Ya anonimizado
        }

        var datosPrevios = JsonSerializer.Serialize(new
        {
            cliente.Nombre,
            cliente.DNI,
            cliente.Email,
            cliente.Telefono,
            cliente.Direccion
        });

        cliente.Nombre = $"Cliente Anónimo #{cliente.Id}";
        cliente.DNI = "00000000";
        cliente.Email = $"anonimo_{cliente.Id}@deleted.local";
        cliente.Telefono = "000000000";
        cliente.Direccion = "ANONIMIZADO";
        cliente.EsAnonimizado = true;
        cliente.FechaAnonimizacion = DateTime.UtcNow;

        _unitOfWork.Usuarios.Update(cliente);

        var datosNuevos = JsonSerializer.Serialize(new
        {
            cliente.Nombre,
            cliente.DNI,
            cliente.Email,
            cliente.EsAnonimizado,
            cliente.FechaAnonimizacion
        });

        await _auditoriaService.RegistrarAccionAsync(
            usuarioId: ejecutadoPorUsuarioId,
            accion: "AnonimizacionCliente",
            entidadNombre: "Usuario",
            entidadId: clienteUsuarioId.ToString(),
            datosPrevios: datosPrevios,
            datosNuevos: datosNuevos,
            ipAddress: ipAddress
        );

        await _unitOfWork.CommitAsync();
        return cliente;
    }
}
