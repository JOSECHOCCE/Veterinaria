using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Veterinaria.Domain.Entities;

namespace Veterinaria.Web.Services;

public class PdfService
{
    public byte[] GenerarComprobantePago(Cita cita, Pago pago)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A5);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Element(c => ComposeHeader(c, "COMPROBANTE DE PAGO"));
                page.Content().Element(c => ComposeContentPago(c, cita, pago));
                page.Footer().Element(ComposeFooter);
            });
        });

        return document.GeneratePdf();
    }

    public byte[] GenerarFichaCita(Cita cita)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A5);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Element(c => ComposeHeader(c, "FICHA DE CITA"));
                page.Content().Element(c => ComposeContentCita(c, cita));
                page.Footer().Element(ComposeFooter);
            });
        });

        return document.GeneratePdf();
    }

    private void ComposeHeader(IContainer container, string titulo)
    {
        container.Column(column =>
        {
            column.Item().Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text("VetCare Pro")
                        .FontSize(24)
                        .Bold()
                        .FontColor(Colors.Blue.Darken2);
                    col.Item().Text("Clínica Veterinaria")
                        .FontSize(10)
                        .FontColor(Colors.Grey.Medium);
                });

                row.ConstantItem(100).AlignRight().Column(col =>
                {
                    col.Item().Text(DateTime.Now.ToString("dd/MM/yyyy"))
                        .FontSize(10)
                        .FontColor(Colors.Grey.Darken1);
                    col.Item().Text(DateTime.Now.ToString("HH:mm"))
                        .FontSize(10)
                        .FontColor(Colors.Grey.Darken1);
                });
            });

            column.Item().PaddingTop(10).LineHorizontal(2).LineColor(Colors.Blue.Darken2);
            
            column.Item().PaddingTop(10).AlignCenter().Text(titulo)
                .FontSize(16)
                .Bold()
                .FontColor(Colors.Blue.Darken3);
        });
    }

    private void ComposeContentPago(IContainer container, Cita cita, Pago pago)
    {
        container.PaddingVertical(20).Column(column =>
        {
            // Referencia
            column.Item().Background(Colors.Green.Lighten4).Padding(10).Column(refCol =>
            {
                refCol.Item().AlignCenter().Text("✓ PAGO EXITOSO")
                    .FontSize(14).Bold().FontColor(Colors.Green.Darken3);
                refCol.Item().AlignCenter().Text($"Referencia: {pago.Referencia}")
                    .FontSize(12).FontColor(Colors.Green.Darken2);
            });

            column.Item().PaddingTop(15);

            // Detalles de la cita
            column.Item().Text("DATOS DE LA CITA").Bold().FontColor(Colors.Grey.Darken2);
            column.Item().PaddingTop(5).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(2);
                });

                table.Cell().Text("Mascota:").SemiBold();
                table.Cell().Text(cita.Mascota?.Nombre ?? "-");

                table.Cell().Text("Propietario:").SemiBold();
                table.Cell().Text(cita.Mascota?.Usuario?.Nombre ?? "-");

                table.Cell().Text("Servicio:").SemiBold();
                table.Cell().Text(cita.Servicio?.Nombre ?? "-");

                table.Cell().Text("Veterinario:").SemiBold();
                table.Cell().Text(cita.Veterinario?.Nombre ?? "-");

                table.Cell().Text("Fecha y Hora:").SemiBold();
                table.Cell().Text(cita.FechaHora.ToString("dd/MM/yyyy HH:mm"));
            });

            column.Item().PaddingTop(15).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
            column.Item().PaddingTop(10);

            // Detalles del pago
            column.Item().Text("DATOS DEL PAGO").Bold().FontColor(Colors.Grey.Darken2);
            column.Item().PaddingTop(5).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(2);
                });

                table.Cell().Text("Método:").SemiBold();
                table.Cell().Text(pago.MetodoPago == "Tarjeta" ? $"Tarjeta ****{pago.UltimosDigitosTarjeta}" : "Efectivo");

                table.Cell().Text("Tipo:").SemiBold();
                table.Cell().Text(pago.TipoPago == "Completo" ? "Pago Completo" : pago.TipoPago == "Parcial" ? "Pago Parcial (50%)" : "Pago Restante");

                table.Cell().Text("Fecha:").SemiBold();
                table.Cell().Text(pago.FechaPago.ToString("dd/MM/yyyy HH:mm"));
            });

            column.Item().PaddingTop(15);

            // Monto
            column.Item().Background(Colors.Blue.Lighten4).Padding(10).Row(row =>
            {
                row.RelativeItem().Text("MONTO PAGADO:").Bold().FontSize(14);
                row.RelativeItem().AlignRight().Text($"€{pago.Monto:N2}").Bold().FontSize(16).FontColor(Colors.Blue.Darken3);
            });

            // Estado de la cita
            column.Item().PaddingTop(10);
            if (cita.EstadoPago == "Parcial")
            {
                column.Item().Background(Colors.Orange.Lighten4).Padding(8).AlignCenter()
                    .Text($"Saldo pendiente: €{(cita.MontoTotal - cita.MontoPagado):N2}")
                    .FontColor(Colors.Orange.Darken3).SemiBold();
            }
            else
            {
                column.Item().Background(Colors.Green.Lighten4).Padding(8).AlignCenter()
                    .Text("PAGO COMPLETO - Sin saldo pendiente")
                    .FontColor(Colors.Green.Darken3).SemiBold();
            }
        });
    }

    private void ComposeContentCita(IContainer container, Cita cita)
    {
        container.PaddingVertical(20).Column(column =>
        {
            // Número de cita
            column.Item().Background(Colors.Blue.Lighten4).Padding(10).AlignCenter()
                .Text($"CITA #{cita.Id:D6}")
                .FontSize(16).Bold().FontColor(Colors.Blue.Darken3);

            column.Item().PaddingTop(15);

            // Fecha y Hora destacada
            column.Item().Border(1).BorderColor(Colors.Grey.Lighten1).Padding(10).Column(fechaCol =>
            {
                fechaCol.Item().AlignCenter().Text(cita.FechaHora.ToString("dddd, dd 'de' MMMM 'de' yyyy"))
                    .FontSize(12).SemiBold();
                fechaCol.Item().AlignCenter().Text(cita.FechaHora.ToString("HH:mm") + " hrs")
                    .FontSize(18).Bold().FontColor(Colors.Blue.Darken2);
            });

            column.Item().PaddingTop(15);

            // Detalles
            column.Item().Text("DATOS DE LA MASCOTA").Bold().FontColor(Colors.Grey.Darken2);
            column.Item().PaddingTop(5).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(2);
                });

                table.Cell().Text("Nombre:").SemiBold();
                table.Cell().Text(cita.Mascota?.Nombre ?? "-");

                table.Cell().Text("Especie:").SemiBold();
                table.Cell().Text(cita.Mascota?.Especie ?? "-");

                table.Cell().Text("Propietario:").SemiBold();
                table.Cell().Text(cita.Mascota?.Usuario?.Nombre ?? "-");
            });

            column.Item().PaddingTop(10);

            column.Item().Text("DATOS DEL SERVICIO").Bold().FontColor(Colors.Grey.Darken2);
            column.Item().PaddingTop(5).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(2);
                });

                table.Cell().Text("Servicio:").SemiBold();
                table.Cell().Text(cita.Servicio?.Nombre ?? "-");

                table.Cell().Text("Veterinario:").SemiBold();
                table.Cell().Text(cita.Veterinario?.Nombre ?? "-");

                table.Cell().Text("Duración:").SemiBold();
                table.Cell().Text($"{cita.Servicio?.DuracionMinutos ?? 0} minutos");
            });

            column.Item().PaddingTop(15);

            // Estado de pago
            var colorPago = cita.EstadoPago switch
            {
                "Pagado" => Colors.Green.Lighten4,
                "Parcial" => Colors.Orange.Lighten4,
                _ => Colors.Grey.Lighten3
            };
            var textoPago = cita.EstadoPago switch
            {
                "Pagado" => "✓ PAGADO COMPLETO",
                "Parcial" => $"⚠ PAGO PARCIAL - Pendiente: €{(cita.MontoTotal - cita.MontoPagado):N2}",
                _ => "⏳ PAGO PENDIENTE"
            };

            column.Item().Background(colorPago).Padding(10).Column(pagoCol =>
            {
                pagoCol.Item().Row(row =>
                {
                    row.RelativeItem().Text("Total:").SemiBold();
                    row.RelativeItem().AlignRight().Text($"€{cita.MontoTotal:N2}").Bold();
                });
                pagoCol.Item().Row(row =>
                {
                    row.RelativeItem().Text("Pagado:").SemiBold();
                    row.RelativeItem().AlignRight().Text($"€{cita.MontoPagado:N2}").Bold();
                });
                pagoCol.Item().PaddingTop(5).AlignCenter().Text(textoPago).FontSize(10).Bold();
            });

            column.Item().PaddingTop(15);

            // Instrucciones
            column.Item().Text("INSTRUCCIONES").Bold().FontColor(Colors.Grey.Darken2);
            column.Item().PaddingTop(5).Text("• Presentar esta ficha en recepción").FontSize(9);
            column.Item().Text("• Llegar 10 minutos antes de la cita").FontSize(9);
            column.Item().Text("• Traer historial médico si es primera visita").FontSize(9);
        });
    }

    public byte[] GenerarVoucherPagoEfectivo(Cita cita, decimal montoPagado, decimal montoRestante, decimal montoTotal, string referencia)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A5);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Element(c => ComposeHeader(c, "VOUCHER DE PAGO"));
                page.Content().Element(c => ComposeContentVoucherEfectivo(c, cita, montoPagado, montoRestante, montoTotal, referencia));
                page.Footer().Element(ComposeFooter);
            });
        });

        return document.GeneratePdf();
    }

    private void ComposeContentVoucherEfectivo(IContainer container, Cita cita, decimal montoPagado, decimal montoRestante, decimal montoTotal, string referencia)
    {
        container.PaddingVertical(20).Column(column =>
        {
            // Referencia del voucher
            column.Item().Background(Colors.Orange.Lighten4).Padding(10).Column(refCol =>
            {
                refCol.Item().AlignCenter().Text("⚠ PAGO PENDIENTE EN CAJA")
                    .FontSize(14).Bold().FontColor(Colors.Orange.Darken3);
                refCol.Item().AlignCenter().Text($"Voucher: {referencia}")
                    .FontSize(12).FontColor(Colors.Orange.Darken2);
            });

            column.Item().PaddingTop(15);

            // Mensaje principal
            column.Item().Background(Colors.Yellow.Lighten4).Border(2).BorderColor(Colors.Orange.Medium).Padding(12).Column(msgCol =>
            {
                msgCol.Item().AlignCenter().Text("ACÉRQUESE A CAJA PARA COMPLETAR")
                    .FontSize(13).Bold().FontColor(Colors.Orange.Darken4);
                msgCol.Item().AlignCenter().Text("SU PAGO PARA PASAR A RECOGER")
                    .FontSize(13).Bold().FontColor(Colors.Orange.Darken4);
                msgCol.Item().AlignCenter().Text("A SU MASCOTA")
                    .FontSize(13).Bold().FontColor(Colors.Orange.Darken4);
            });

            column.Item().PaddingTop(15);

            // Detalles de la cita
            column.Item().Text("DATOS DE LA CITA").Bold().FontColor(Colors.Grey.Darken2);
            column.Item().PaddingTop(5).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(2);
                });

                table.Cell().Text("Mascota:").SemiBold();
                table.Cell().Text(cita.Mascota?.Nombre ?? "-");

                table.Cell().Text("Propietario:").SemiBold();
                table.Cell().Text(cita.Mascota?.Usuario?.Nombre ?? "-");

                table.Cell().Text("Servicio:").SemiBold();
                table.Cell().Text(cita.Servicio?.Nombre ?? "-");

                table.Cell().Text("Fecha Atención:").SemiBold();
                table.Cell().Text(cita.FechaHora.ToString("dd/MM/yyyy HH:mm"));

                table.Cell().Text("Estado Cita:").SemiBold();
                table.Cell().Text("COMPLETADA ✓").FontColor(Colors.Green.Darken2);
            });

            column.Item().PaddingTop(15).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
            column.Item().PaddingTop(10);

            // Resumen de pagos
            column.Item().Text("RESUMEN DE PAGOS").Bold().FontColor(Colors.Grey.Darken2);
            column.Item().PaddingTop(10).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2);
                    columns.RelativeColumn(1);
                });

                // Total del servicio
                table.Cell().Text("Total del Servicio:").SemiBold();
                table.Cell().AlignRight().Text($"S/. {montoTotal:N2}");

                // Monto ya pagado
                table.Cell().Text("Monto Pagado (Tarjeta):").SemiBold().FontColor(Colors.Green.Darken2);
                table.Cell().AlignRight().Text($"S/. {montoPagado:N2}").FontColor(Colors.Green.Darken2);
            });

            column.Item().PaddingTop(10);

            // Monto a pagar en caja - DESTACADO
            column.Item().Background(Colors.Red.Lighten4).Border(2).BorderColor(Colors.Red.Medium).Padding(12).Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text("MONTO A PAGAR EN CAJA:").Bold().FontSize(12).FontColor(Colors.Red.Darken3);
                    col.Item().Text("(Pago en Efectivo)").FontSize(9).FontColor(Colors.Red.Darken2);
                });
                row.ConstantItem(100).AlignRight().AlignMiddle()
                    .Text($"S/. {montoRestante:N2}").Bold().FontSize(18).FontColor(Colors.Red.Darken3);
            });

            column.Item().PaddingTop(15);

            // Fecha de emisión
            column.Item().AlignCenter().Text($"Voucher generado: {DateTime.Now:dd/MM/yyyy HH:mm}")
                .FontSize(9).FontColor(Colors.Grey.Darken1);
            
            column.Item().PaddingTop(5);
            column.Item().AlignCenter().Text("Válido solo para el día de hoy")
                .FontSize(9).Italic().FontColor(Colors.Grey.Darken1);
        });
    }

    public byte[] GenerarFacturaVenta(Venta venta)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A5);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Element(c => ComposeHeader(c, "COMPROBANTE DE COMPRA (FACTURA)"));
                page.Content().Element(c => ComposeContentVenta(c, venta));
                page.Footer().Element(ComposeFooter);
            });
        });

        return document.GeneratePdf();
    }

    private void ComposeContentVenta(IContainer container, Venta venta)
    {
        container.PaddingVertical(20).Column(column =>
        {
            // Referencia
            column.Item().Background(Colors.Green.Lighten4).Padding(10).Column(refCol =>
            {
                refCol.Item().AlignCenter().Text("✓ COMPRA COMPLETADA")
                    .FontSize(14).Bold().FontColor(Colors.Green.Darken3);
                refCol.Item().AlignCenter().Text($"Factura N°: FAC-{venta.Id:D6}")
                    .FontSize(12).FontColor(Colors.Green.Darken2);
            });

            column.Item().PaddingTop(15);

            // Datos del cliente
            column.Item().Text("DATOS DEL CLIENTE").Bold().FontColor(Colors.Grey.Darken2);
            column.Item().PaddingTop(5).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(2);
                });

                table.Cell().Text("Cliente:").SemiBold();
                table.Cell().Text(venta.Cliente?.Nombre ?? "Cliente General");

                table.Cell().Text("Email:").SemiBold();
                table.Cell().Text(venta.Cliente?.Email ?? "-");

                table.Cell().Text("DNI:").SemiBold();
                table.Cell().Text(venta.Cliente?.DNI ?? "-");

                table.Cell().Text("Fecha:").SemiBold();
                table.Cell().Text(venta.Fecha.ToString("dd/MM/yyyy HH:mm"));
            });

            column.Item().PaddingTop(15).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
            column.Item().PaddingTop(10);

            // Detalles de los productos
            column.Item().Text("PRODUCTOS ADQUIRIDOS").Bold().FontColor(Colors.Grey.Darken2);
            column.Item().PaddingTop(5).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(3); // Producto
                    columns.RelativeColumn(1); // Cant
                    columns.RelativeColumn(1.5f); // P. Unit
                    columns.RelativeColumn(1.5f); // Subtotal
                });

                // Cabeceras
                table.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Producto").Bold();
                table.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Cant").Bold();
                table.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("P. Unit").Bold();
                table.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Total").Bold();

                foreach (var detalle in venta.Detalles)
                {
                    table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(detalle.Producto?.Nombre ?? "Producto");
                    table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(detalle.Cantidad.ToString());
                    table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text($"S/. {detalle.PrecioUnitario:N2}");
                    table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text($"S/. {detalle.Subtotal:N2}");
                }
            });

            column.Item().PaddingTop(15);

            // Monto total
            column.Item().Background(Colors.Blue.Lighten4).Padding(10).Row(row =>
            {
                row.RelativeItem().Text("TOTAL PAGADO:").Bold().FontSize(14);
                row.RelativeItem().AlignRight().Text($"S/. {venta.Total:N2}").Bold().FontSize(16).FontColor(Colors.Blue.Darken3);
            });

            column.Item().PaddingTop(10);
            column.Item().Background(Colors.Green.Lighten4).Padding(8).AlignCenter()
                .Text($"Método de pago: {venta.MetodoPago}")
                .FontColor(Colors.Green.Darken3).SemiBold();
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.Column(column =>
        {
            column.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
            column.Item().PaddingTop(5).Row(row =>
            {
                row.RelativeItem().Text("VetCare Pro - Clínica Veterinaria")
                    .FontSize(8).FontColor(Colors.Grey.Medium);
                row.RelativeItem().AlignCenter().Text("Tel: (01) 234-5678")
                    .FontSize(8).FontColor(Colors.Grey.Medium);
                row.RelativeItem().AlignRight().Text("www.vetcarepro.com")
                    .FontSize(8).FontColor(Colors.Grey.Medium);
            });
        });
    }
}
