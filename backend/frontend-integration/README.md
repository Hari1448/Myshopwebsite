# Frontend API helper

1. Copy `api.js` to `frontend/src/api.js`.
2. Create `frontend/.env` with:
   `VITE_API_URL=http://localhost:5000/api`
3. Restart Vite after changing `.env`.
4. Import functions from `./api.js` in React components.

Example login:
```jsx
import { login } from "./api.js";

async function handleLogin(email, password) {
  try {
    const admin = await login(email, password);
    console.log("Logged in:", admin.name);
  } catch (error) {
    alert(error.message);
  }
}
```

Example loading products:
```jsx
import { useEffect, useState } from "react";
import { api } from "./api.js";

function ProductLoader() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.products()
      .then(setProducts)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p>{error}</p>;
  return <p>Loaded {products.length} products from PostgreSQL.</p>;
}
```

The uploaded frontend currently uses `initialProducts`, `initialSales`, and related mock arrays. Replace each state initializer/load handler with API calls, and make save handlers await `api.createProduct`, `api.createSale`, etc. Product and category IDs returned from PostgreSQL are numeric; update component code to use these returned IDs rather than relying on the mock IDs like `PRD-101`.

For billing, map cart items to `{ product_id: Number(item.id), quantity: Number(item.quantity) }`, and send `{invoice_no, customer_name, customer_phone, payment_mode, payment_status, fee, notes, items}` to `api.createSale`. The server calculates totals from database prices and deducts stock atomically. Do not trust totals calculated only in the browser.
