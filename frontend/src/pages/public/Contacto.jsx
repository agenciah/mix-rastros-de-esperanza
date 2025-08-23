import { useRef, useState } from "react"
import emailjs from "@emailjs/browser"
import LegalLayout from "@/layouts/LegalLayouts"

export default function Contacto() {
  const formRef = useRef()
  const [status, setStatus] = useState(null)

  const sendEmail = (e) => {
    e.preventDefault()

    emailjs
      .sendForm(
        "service_b33w4vq",      // ← reemplaza con tu SERVICE ID
        "template_qjump19",     // ← reemplaza con tu TEMPLATE ID
        formRef.current,
        "MQWk6rSdymGEGYxbT"       // ← reemplaza con tu PUBLIC KEY
      )
      .then(
        (result) => {
          setStatus("Mensaje enviado correctamente.")
          formRef.current.reset()
        },
        (error) => {
          setStatus("Ocurrió un error. Intenta de nuevo.")
        }
      )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-gray-800">

      <LegalLayout>
        <h1 className="text-3xl font-bold mb-6">Contáctanos</h1>

      <p className="mb-4">
        ¿Tienes dudas o comentarios? Llena este formulario y te responderemos muy pronto.
      </p>

      <form ref={formRef} onSubmit={sendEmail} className="space-y-4">
        <input
            type="text"
            name="from_name"
            placeholder="Tu nombre"
            required
            className="w-full p-2 border rounded"
        />
        <input
            type="email"
            name="from_email"
            placeholder="Tu correo"
            required
            className="w-full p-2 border rounded"
        />
        <textarea
            name="message"
            placeholder="¿Cómo podemos ayudarte?"
            required
            className="w-full p-2 border rounded h-32"
        ></textarea>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Enviar mensaje
        </button>
        {status && (
            <div className={`mt-4 text-sm ${status.includes("error") ? "text-red-500" : "text-green-600"}`}>
                {status}
            </div>
            )}
        </form>
    </LegalLayout>
      

    </div>
  )
}
