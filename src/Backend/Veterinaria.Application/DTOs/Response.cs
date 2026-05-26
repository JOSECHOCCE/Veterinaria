namespace Veterinaria.Application.DTOs
{
    public class Response<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }

        public Response()
        {
        }

        public Response(bool success, string message, T data = default)
        {
            Success = success;
            Message = message;
            Data = data;
        }

        public static Response<T> Ok(T data, string message = "Operación exitosa")
        {
            return new Response<T>(true, message, data);
        }

        public static Response<T> Fail(string message, T data = default)
        {
            return new Response<T>(false, message, data);
        }
    }
}
