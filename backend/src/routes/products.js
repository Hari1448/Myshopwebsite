import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { validate } from '../middleware/validate.js';
const router = Router();
const schema = z.object({
 sku:z.string().trim().max(80).optional().nullable(), name:z.string().trim().min(1).max(200),
 category_id:z.coerce.number().int().positive().optional().nullable(), category_name:z.string().trim().max(100).optional().default(''),
 price:z.coerce.number().min(0).optional().default(0), cost_price:z.coerce.number().min(0).optional().default(0),
 stock:z.coerce.number().int().min(0).optional().default(0), low_stock_threshold:z.coerce.number().int().min(0).optional().default(5),
 unit:z.string().trim().min(1).max(30).optional().default('pcs'), active:z.boolean().optional().default(true)
});
router.get('/next-code', async(_req,res,next)=>{ try { const r=await pool.query('SELECT last_value, is_called FROM product_code_seq'); const row=r.rows[0]; res.json({ code: row.is_called ? Number(row.last_value)+1 : Number(row.last_value) }); }catch(e){next(e);} });
router.get('/', async(req,res,next)=>{ try { const q=String(req.query.q||'').slice(0,100); const r=await pool.query(`SELECT * FROM products WHERE active=true AND ($1='' OR name ILIKE '%'||$1||'%' OR code::text=$1 OR COALESCE(sku,'') ILIKE '%'||$1||'%') ORDER BY code LIMIT 500`,[q]); res.json(r.rows); }catch(e){next(e);} });
router.post('/', validate(schema), async(req,res,next)=>{ try { const b=req.body; const r=await pool.query(`INSERT INTO products(sku,name,category_id,category_name,price,cost_price,stock,low_stock_threshold,unit,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,[b.sku||null,b.name,b.category_id||null,b.category_name,b.price,b.cost_price,b.stock,b.low_stock_threshold,b.unit,b.active]); res.status(201).json(r.rows[0]); }catch(e){next(e);} });
router.put('/:id', validate(schema), async(req,res,next)=>{ try { const b=req.body; const r=await pool.query(`UPDATE products SET sku=$1,name=$2,category_id=$3,category_name=$4,price=$5,cost_price=$6,stock=$7,low_stock_threshold=$8,unit=$9,active=$10,updated_at=NOW() WHERE id=$11 RETURNING *`,[b.sku||null,b.name,b.category_id||null,b.category_name,b.price,b.cost_price,b.stock,b.low_stock_threshold,b.unit,b.active,req.params.id]); if(!r.rowCount)return res.status(404).json({error:'Product not found'}); res.json(r.rows[0]); }catch(e){next(e);} });
router.patch('/:id/stock', async(req,res,next)=>{ try { const delta=Number(req.body.delta); if(!Number.isInteger(delta)||delta===0)return res.status(400).json({error:'delta must be a non-zero integer'}); const r=await pool.query('UPDATE products SET stock=stock+$1,updated_at=NOW() WHERE id=$2 AND stock+$1>=0 RETURNING *',[delta,req.params.id]); if(!r.rowCount)return res.status(400).json({error:'Product not found or stock cannot become negative'}); res.json(r.rows[0]); }catch(e){next(e);} });
router.delete('/:id', async(req,res,next)=>{ try { const r=await pool.query('UPDATE products SET active=false,updated_at=NOW() WHERE id=$1 RETURNING id',[req.params.id]); if(!r.rowCount)return res.status(404).json({error:'Product not found'}); res.status(204).end(); }catch(e){next(e);} });
export default router;
