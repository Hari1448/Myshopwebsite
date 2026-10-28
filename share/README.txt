SUNMADHI STORE - run from private registry

1. Install Docker Desktop and start it.
2. docker login            (use the account that was given access)
3. Copy .env.example to .env and edit the passwords.
4. docker compose up -d
5. Open http://localhost:5055
Stop: docker compose down   (data is kept)
