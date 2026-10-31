# GESCOM · Diagramas de los anexos

Sitio estático (GitHub Pages) con los diagramas completos de los anexos C y D del
Trabajo Terminal 2027-A240. Cada diagrama tiene su propia página, que es a donde
apuntan los códigos QR de la presentación.

| Página | Diagrama |
|---|---|
| `/contexto/` | Anexo C · Diagrama de contexto (C4 nivel 1) |
| `/contenedores/` | Anexo C · Diagrama de contenedores (C4 nivel 2) |
| `/modulos/` | Anexo C · Módulos de la API (C4 nivel 3) |
| `/er/` | Anexo D · Modelo ER sin atributos |
| `/er-atributos/` | Anexo D · Modelo ER con atributos |
| `/relacional/` | Anexo D · Esquema relacional |
| `/qr.html` | Genera y descarga los QR de cada página |

Los diagramas del anexo D son SVG (vectoriales), así que se ven nítidos a cualquier zoom.
Para cambiar un diagrama basta con reemplazar el archivo en `img/` con el mismo nombre.

Vista previa local: `python3 -m http.server 8000` dentro de esta carpeta y abrir
http://localhost:8000
