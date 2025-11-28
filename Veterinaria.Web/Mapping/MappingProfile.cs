using AutoMapper;
using Veterinaria.Domain.Entities;
using Veterinaria.Web.Models.Dto;

namespace Veterinaria.Web.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Usuario <-> UsuarioDto
        CreateMap<Usuario, UsuarioDto>().ReverseMap();

        // Mascota <-> MascotaDto
        CreateMap<Mascota, MascotaDto>()
            .ForMember(dest => dest.Edad, opt => opt.Ignore()) // Propiedad calculada en el DTO
            .ForMember(dest => dest.UsuarioNombre, opt => opt.MapFrom(src => src.Usuario != null ? src.Usuario.Nombre : null))
            .ReverseMap()
            .ForMember(dest => dest.Usuario, opt => opt.Ignore()); // No mapear navegación inversa

        // Veterinario <-> VeterinarioDto
        CreateMap<Veterinario, VeterinarioDto>().ReverseMap();

        // Servicio <-> ServicioDto
        CreateMap<Servicio, ServicioDto>().ReverseMap();

        // Cita <-> CitaDto
        CreateMap<Cita, CitaDto>()
            .ForMember(dest => dest.MascotaNombre, opt => opt.MapFrom(src => src.Mascota != null ? src.Mascota.Nombre : null))
            .ForMember(dest => dest.PropietarioNombre, opt => opt.MapFrom(src => src.Mascota != null && src.Mascota.Usuario != null ? src.Mascota.Usuario.Nombre : null))
            .ForMember(dest => dest.VeterinarioNombre, opt => opt.MapFrom(src => src.Veterinario != null ? src.Veterinario.Nombre : null))
            .ForMember(dest => dest.ServicioNombre, opt => opt.MapFrom(src => src.Servicio != null ? src.Servicio.Nombre : null))
            .ForMember(dest => dest.PrecioServicio, opt => opt.MapFrom(src => src.Servicio != null ? src.Servicio.Precio : (decimal?)null))
            .ReverseMap()
            .ForMember(dest => dest.Mascota, opt => opt.Ignore())
            .ForMember(dest => dest.Veterinario, opt => opt.Ignore())
            .ForMember(dest => dest.Servicio, opt => opt.Ignore())
            .ForMember(dest => dest.Historial, opt => opt.Ignore())
            .ForMember(dest => dest.Pagos, opt => opt.Ignore());

        // HistorialClinico <-> HistorialClinicoDto
        CreateMap<HistorialClinico, HistorialClinicoDto>()
            .ReverseMap()
            .ForMember(dest => dest.Cita, opt => opt.Ignore());

        // Pago <-> PagoDto
        CreateMap<Pago, PagoDto>()
            .ReverseMap()
            .ForMember(dest => dest.Cita, opt => opt.Ignore());
    }
}
