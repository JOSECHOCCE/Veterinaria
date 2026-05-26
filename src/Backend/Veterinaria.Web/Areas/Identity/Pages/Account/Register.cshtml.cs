using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Veterinaria.Domain.Contracts;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Web.Areas.Identity.Pages.Account
{
    public class RegisterModel : PageModel
    {
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<RegisterModel> _logger;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IUnitOfWork _unitOfWork;

        public RegisterModel(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ILogger<RegisterModel> logger,
            RoleManager<IdentityRole> roleManager,
            IUnitOfWork unitOfWork)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _logger = logger;
            _roleManager = roleManager;
            _unitOfWork = unitOfWork;
        }

        [BindProperty]
        public InputModel Input { get; set; } = new();

        public string? ReturnUrl { get; set; }

        public class InputModel
        {
            [Required(ErrorMessage = "El nombre completo es requerido")]
            [StringLength(100, ErrorMessage = "El nombre debe tener máximo {1} caracteres")]
            [Display(Name = "Nombre Completo")]
            public string NombreCompleto { get; set; } = string.Empty;

            [Required(ErrorMessage = "El DNI es requerido")]
            [StringLength(20, ErrorMessage = "El DNI debe tener máximo {1} caracteres")]
            [Display(Name = "DNI")]
            public string DNI { get; set; } = string.Empty;

            [Required(ErrorMessage = "El correo electrónico es requerido")]
            [EmailAddress(ErrorMessage = "El formato del correo no es válido")]
            [Display(Name = "Correo Electrónico")]
            public string Email { get; set; } = string.Empty;

            [Required(ErrorMessage = "El teléfono es requerido")]
            [StringLength(20, ErrorMessage = "El teléfono debe tener máximo {1} caracteres")]
            [Phone(ErrorMessage = "El formato del teléfono no es válido")]
            [Display(Name = "Teléfono")]
            public string Telefono { get; set; } = string.Empty;

            [Required(ErrorMessage = "La dirección es requerida")]
            [StringLength(200, ErrorMessage = "La dirección debe tener máximo {1} caracteres")]
            [Display(Name = "Dirección")]
            public string Direccion { get; set; } = string.Empty;

            [Required(ErrorMessage = "La contraseña es requerida")]
            [StringLength(100, ErrorMessage = "La {0} debe tener al menos {2} y máximo {1} caracteres.", MinimumLength = 6)]
            [DataType(DataType.Password)]
            [Display(Name = "Contraseña")]
            public string Password { get; set; } = string.Empty;

            [DataType(DataType.Password)]
            [Display(Name = "Confirmar contraseña")]
            [Compare("Password", ErrorMessage = "Las contraseñas no coinciden.")]
            public string ConfirmPassword { get; set; } = string.Empty;
        }

        public async Task OnGetAsync(string? returnUrl = null)
        {
            ReturnUrl = returnUrl;
        }

        public async Task<IActionResult> OnPostAsync(string? returnUrl = null)
        {
            returnUrl ??= Url.Content("~/");
            
            if (ModelState.IsValid)
            {
                var user = new ApplicationUser
                {
                    UserName = Input.Email,
                    Email = Input.Email,
                    NombreCompleto = Input.NombreCompleto,
                    FechaRegistro = DateTime.Now
                };

                var result = await _userManager.CreateAsync(user, Input.Password);

                if (result.Succeeded)
                {
                    _logger.LogInformation("Usuario creado con contraseña.");

                    // Asegurar que existen los roles
                    if (!await _roleManager.RoleExistsAsync("Admin"))
                    {
                        await _roleManager.CreateAsync(new IdentityRole("Admin"));
                    }
                    if (!await _roleManager.RoleExistsAsync("Usuario"))
                    {
                        await _roleManager.CreateAsync(new IdentityRole("Usuario"));
                    }

                    // Asignar rol "Usuario" por defecto
                    await _userManager.AddToRoleAsync(user, "Usuario");

                    // Crear el Usuario en la tabla del dominio con todos los datos
                    var usuario = new Usuario
                    {
                        Nombre = Input.NombreCompleto,
                        Email = Input.Email,
                        DNI = Input.DNI,
                        Telefono = Input.Telefono,
                        Direccion = Input.Direccion,
                        Rol = "Usuario",
                        Activo = true,
                        FechaRegistro = DateTime.Now,
                        ApplicationUserId = user.Id
                    };

                    await _unitOfWork.Usuarios.AddAsync(usuario);
                    await _unitOfWork.CommitAsync();

                    await _signInManager.SignInAsync(user, isPersistent: false);
                    
                    // Redirigir a Citas después del registro
                    return LocalRedirect("/Citas");
                }

                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(string.Empty, error.Description);
                }
            }

            return Page();
        }
    }
}
