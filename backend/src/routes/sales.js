import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { validate } from '../middleware/validate.js';
const router = Router();
const schema = z.object({
 invoice_no:z.string().trim().min(1).max(80), customer_name:z.string().trim().max(200).optional().default('Walk-in Customer'),
 customer_phone:z.string().trim().max(30).optional().default(''), discount:z.coerce.number().min(0).optional().default(0), fee:z.coerce.number().min(0).optional().default(0), paid_amount:z.coerce.number().min(0).optional().default(0),
 payment_mode:z.enum(['Cash','UPI','Card','Credit','Other']), payment_status:z.enum(['Paid','Pending','Partial']).optional().default('Paid'),
 notes:z.string().max(1000).optional().default(''),
 items:z.array(z.object({product_id:z.coerce.number().int().positive().optional(),name:z.string().trim().max(200).optional(),unit_price:z.coerce.number().min(0).optional(),quantity:z.coerce.number().int().positive().max(100000)}).refine(x => x.product_id || (x.name && x.unit_price !== undefined), { message: 'Provide product_id or a custom item name and unit_price' })).min(1)
});
router.get('/', async(req,res,next)=>{ try { const limit=Math.min(200,Math.max(1,Number(req.query.limit)||100)); const r=await pool.query(`SELECT s.*, COALESCE((SELECT json_agg(json_build_object('product_id',si.product_id,'product_name',si.product_name,'quantity',si.quantity,'unit_price',si.unit_price,'line_total',si.line_total,'category_name',COALESCE(NULLIF(p.category_name,''),'General')) ORDER BY si.id) FROM sale_items si LEFT JOIN products p ON p.id=si.product_id WHERE si.sale_id=s.id),'[]'::json) AS line_items FROM sales s ORDER BY s.created_at DESC LIMIT $1`,[limit]); res.json(r.rows); }catch(e){next(e);} });
router.get('/:id/items', async(req,res,next)=>{ try { const r=await pool.query('SELECT * FROM sale_items WHERE sale_id=$1 ORDER BY id',[req.params.id]); res.json(r.rows); }catch(e){next(e);} });
router.post('/', validate(schema), async(req,res,next)=>{
 const client=await pool.connect();
 try {
  await client.query('BEGIN');
  const b=req.body, invoice=b.invoice_no;
  let subtotal=0, items=[];
  for(const item of b.items){
   if (item.product_id) {
    const p=await client.query('SELECT id,name,price,stock FROM products WHERE id=$1 AND active=true FOR UPDATE',[item.product_id]);
    if(!p.rowCount)throw Object.assign(new Error(`Product ${item.product_id} not found`),{status:400});
    const prod=p.rows[0];
    if(prod.stock<item.quantity)throw Object.assign(new Error(`Insufficient stock for ${prod.name}; available ${prod.stock}`),{status:409});
    const price=(item.unit_price!==undefined&&item.unit_price!==null)?Number(item.unit_price):Number(prod.price), line=price*item.quantity; subtotal+=line;
    items.push({product_id:prod.id,product_name:prod.name,quantity:item.quantity,unit_price:price,line_total:line});
   } else {
    const price=Number(item.unit_price), line=price*item.quantity; subtotal+=line;
    items.push({product_id:null,product_name:item.name,quantity:item.quantity,unit_price:price,line_total:line});
   }
  }
  const discount=Number(b.discount||0); if(discount>subtotal)throw Object.assign(new Error('Discount cannot exceed subtotal'),{status:400}); const total=subtotal-discount+Number(b.fee||0); if (Number(b.paid_amount||0)>total) throw Object.assign(new Error('Paid amount cannot exceed the invoice total'),{status:400});
  const s=await client.query(`INSERT INTO sales(invoice_no,customer_name,customer_phone,subtotal,discount,fee,total_amount,payment_mode,payment_status,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,[invoice,b.customer_name,b.customer_phone,subtotal,discount,b.fee,total,b.payment_mode,b.payment_status,b.notes]);
  for(const it of items){
   await client.query('INSERT INTO sale_items(sale_id,product_id,product_name,quantity,unit_price,line_total) VALUES($1,$2,$3,$4,$5,$6)',[s.rows[0].id,it.product_id,it.product_name,it.quantity,it.unit_price,it.line_total]);
   if (it.product_id) await client.query('UPDATE products SET stock=GREATEST(stock-$1,0),updated_at=NOW() WHERE id=$2',[it.quantity,it.product_id]);
  }
  let creditCustomer = null;
  if (b.payment_mode === 'Credit') {
   const paid = Number(b.paid_amount || 0), balance = Math.max(0, Math.round((total - paid) * 100) / 100);
   const credit = await client.query(`INSERT INTO credit_customers(name,phone,items,total_amount,paid_amount,balance_amount,status,notes,sale_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [b.customer_name, b.customer_phone, items.map(it => `${it.quantity}x ${it.product_name}`).join(', '), total, paid, balance, balance === 0 ? 'Cleared' : 'Pending', b.notes, s.rows[0].id]);
   creditCustomer = credit.rows[0];
  }
  await client.query('COMMIT');
  res.status(201).json({...s.rows[0],items,credit_customer:creditCustomer});
 } catch(e){ await client.query('ROLLBACK'); if(e.status)return res.status(e.status).json({error:e.message}); next(e); }
 finally { client.release(); }
});
export default router;
