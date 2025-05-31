# Como Executar o Projeto

Siga estes passos simples para colocar seu projeto em execução.

---

## Para Usuários Windows

### 1. Iniciar o Backend (FastAPI)

1.  Abra o **Prompt de Comando** ou **PowerShell**.
2.  Navegue até a pasta do seu backend:
    ```bash
    cd backend
    ```
3.  Ative o ambiente virtual (se você criou um):
    ```bash
    .\venv\Scripts\activate
    ```
4.  Inicie o servidor FastAPI:
    ```bash
    uvicorn main:app --reload
    ```
    Mantenha este terminal aberto.

---

### 2. Iniciar o Frontend (React)

1.  Abra um **novo Prompt de Comando** ou **PowerShell**.
2.  Navegue até a pasta do seu frontend:
    ```bash
    cd frontend
    ```
3.  Inicie o aplicativo React:
    ```bash
    npm run dev
    # ou se usar yarn:
    # yarn dev
    ```
    O aplicativo React abrirá no seu navegador, geralmente em `http://localhost:5173`. Se não abrir automaticamente, copie e cole essa URL no seu navegador.

---

### 3. Acessar a Aplicação

Com os dois terminais abertos e os servidores rodando, basta acessar `http://localhost:5173` no seu navegador para usar a aplicação.