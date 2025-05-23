import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import axios from "axios";
import { Check, Loader2 } from "lucide-react";
import { downloadZip } from "./utils/downloadZip";
import { BASE_URL } from "./utils/base";

const categorias = [
  {
    value: 1,
    label: "Salud Integral (Nutrición + Ejercicio + Salud Mental + Energía)",
  },
  {
    value: 2,
    label:
      "Dinero y Expansión (Emprendimiento + Inversiones + Mentalidad + Productividad)",
  },
  {
    value: 3,
    label:
      "Relaciones y Conexión (Pareja + Amor Propio + Comunicación + Sexualidad)",
  },
  {
    value: 4,
    label: "Estética y Espacios (Decoración + Arquitectura + Limpieza)",
  },
  {
    value: 5,
    label:
      "Espiritualidad y Expansión (Manifestación + Astrología + Psicodélicos + Energía)",
  },
  {
    value: 6,
    label:
      "Mascotas y Cuidado Animal (Tiendas de Mascotas + Veterinarias + Adiestramiento + Estética Canina)",
  },
  {
    value: 7,
    label:
      "Joyería y Accesorios (Artesanos + Tiendas de Joyería + Relojerías + Accesorios de Lujo)",
  },
  {
    value: 8,
    label:
      "Bienestar y Cuidado Personal (Spas + Salones de Belleza + Centros Holísticos + Belleza + Cejas)",
  },
];

const formSchema = z.object({
  client: z.string().nonempty("Por favor ingrese un cliente"),
  category: z.string().nonempty("Por favor seleccione una categoría"),
  audience: z.string().nonempty("Por favor seleccione una audiencia"),
  template: z.string().nonempty("Por favor seleccione un template"),
});

async function fetchCsvSheet(url: string) {
  const res = await fetch(url);
  const csv = await res.text();

  const [headerLine, ...lines] = csv.split("\n");
  const headers = headerLine.split(",");

  const data = lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(
      headers.map((key, i) => [key.trim(), values[i]?.trim()]),
    );
  });

  return data;
}

async function generateInfo(
  category: string,
  audience: string,
  template: string,
) {
  try {
    const data = await fetchCsvSheet(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0CgTWOelh6_26T35-_MeOr2N0tC7eUhQrMEmcVfEVWhsd20PsqlON88AA3McfNQYTdcLfjWKNceHj/pub?output=csv",
    );

    const filteredData = data.filter(
      (row: any) =>
        row.CATEGORIA?.includes(category) &&
        (row.AUDIENCIA === audience.toLowerCase() || row.AUDIENCIA === "ambos"),
    );

    const info = filteredData.map((row: any) => ({
      hook: row.TITULO,
      desc: row.CUERPO,
    }));

    return { template: Number(template), info };
  } catch (error) {
    console.error("Error fetching Excel data:", error);
  }
}

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client: "",
      category: "",
      audience: "",
      template: "",
    },
  });

  const template = form.watch("template");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { client, category, audience, template } = values;
    const info = await generateInfo(category, audience, template);

    setIsLoading(true);
    await axios.post(
      `${BASE_URL}/make_videos`,
      {
        userData: client,
        ...info,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    setIsLoading(false);

    setIsFinished(true);
    await new Promise((res) => setTimeout(res, 1000));
    setIsFinished(false);

    downloadZip(client);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Cliente</label>
            <input
              {...form.register("client")}
              className="border p-2 w-[320px] rounded"
              placeholder="John Doe"
            />
            <p className="text-red-500 text-sm">
              {form.formState.errors.client?.message}
            </p>
          </div>

          {/* Category Select */}
          <div>
            <label className="block font-medium mb-1">Categoría</label>
            <select
              {...form.register("category")}
              className="border p-2 w-[320px] rounded"
              defaultValue=""
            >
              <option value="" disabled>
                Seleccione una categoría
              </option>
              {categorias.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-red-500 text-sm">
              {form.formState.errors.category?.message}
            </p>
          </div>

          {/* Audience Select */}
          <div>
            <label className="block font-medium mb-1">Audiencia</label>
            <select
              {...form.register("audience")}
              className="border p-2 w-[320px] rounded"
              defaultValue=""
            >
              <option value="" disabled>
                Seleccione una audiencia
              </option>
              <option value="hombres">Hombres</option>
              <option value="mujeres">Mujeres</option>
              <option value="ambos">Ambos</option>
            </select>
            <p className="text-red-500 text-sm">
              {form.formState.errors.audience?.message}
            </p>
          </div>

          {/* Template Select */}
          <div>
            <label className="block font-medium mb-1">Template</label>
            <select
              {...form.register("template")}
              className="border p-2 w-[320px] rounded"
              defaultValue=""
            >
              <option value="" disabled>
                Seleccione un template
              </option>
              {[
                "01",
                "02",
                "03",
                "04",
                "05",
                "06",
                "07",
                "08",
                "09",
                "10",
                "11",
                "12",
                "13",
                "14",
                "15",
                "16",
                "17",
                "18",
                "19",
                "20",
                "21",
                "22",
                "23",
                "24",
                "25",
                "26",
                "27",
                "28",
                "30",
                "31",
                "32",
                "33",
                "34",
                "35",
                "36",
                "37",
              ].map((img) => {
                const name = img.split(".")[0];
                return (
                  <option key={name} value={name}>
                    {name}
                  </option>
                );
              })}
            </select>
            <p className="text-red-500 text-sm">
              {form.formState.errors.template?.message}
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`mt-4 px-4 py-2 rounded text-white ${isFinished ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"} disabled:opacity-50`}
        >
          {isFinished ? (
            <span className="flex items-center gap-2">
              Enviado! <Check size={16} />
            </span>
          ) : isLoading ? (
            <span className="flex items-center gap-2">
              Enviando <Loader2 className="animate-spin" size={16} />
            </span>
          ) : (
            "Enviar"
          )}
        </button>
      </form>

      {/* Template preview */}
      {template && (
        <div className="max-w-[320px] mx-auto mt-4 border rounded overflow-hidden">
          <img
            src={`/images/${template}.png`}
            alt="Template Preview"
            className="w-full rounded"
          />
        </div>
      )}
    </div>
  );
}
