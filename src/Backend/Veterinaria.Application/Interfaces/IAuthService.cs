using System.Threading.Tasks;
using Veterinaria.Application.DTOs;

namespace Veterinaria.Application.Interfaces;

public interface IAuthService
{
    Task<Response<LoginResponseDto>> LoginAsync(LoginRequestDto request);
    Task<Response<string>> RegisterAsync(RegisterRequestDto request);
    Task<Response<object>> GetProfileAsync(string appUserId);
    Task<Response<string>> UpdateProfileAsync(string appUserId, UpdateProfileRequestDto request);
    Task<Response<string>> ChangePasswordAsync(string appUserId, ChangePasswordRequestDto request);
}
