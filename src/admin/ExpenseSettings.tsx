import { useEffect, useState } from 'react';
import { Input } from './components/ui/Input';
import { Textarea } from './components/ui/Textarea';
import { Button } from './components/ui/Button';
import { Alert } from './components/ui/Alert';
import { Card } from './components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/Select';
const SettingsSelect=({value,onChange,options}:{value:string;onChange:(v:string)=>void;options:string[][]})=><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{options.map(([key,label])=><SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>;
const api=(path:string,options:RequestInit={})=>fetch((window.NognaReact?.restUrl||'')+path,{credentials:'include',...options,headers:{'Content-Type':'application/json','X-WP-Nonce':window.NognaReact?.nonce||'',...(options.headers||{})}}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.message||'Request failed.');return d;});

export function ExpenseSettings({companyId}:{companyId:number|null}) {
 const [categories,setCategories]=useState<any[]>([]); const [category,setCategory]=useState({name:'',description:''}); const [editing,setEditing]=useState<number|null>(null); const [message,setMessage]=useState('');
 const load=()=>{if(companyId)api('/companies/'+companyId+'/expense-categories').then(r=>setCategories(r.data||[])).catch(e=>setMessage(e.message));};
 useEffect(load,[companyId]);
 const save=()=>{if(!companyId||!category.name.trim())return;const path='/companies/'+companyId+'/expense-categories'+(editing?'/'+editing:'');api(path,{method:editing?'PUT':'POST',body:JSON.stringify(category)}).then(()=>{setCategory({name:'',description:''});setEditing(null);setMessage(editing?'Category updated':'Category added');load()}).catch(e=>setMessage(e.message));};
 return <section className="nogna-settings-card nogna-expense-settings"><h2>Expense categories</h2><p className="nogna-settings-help">Define the categories available when recording expenses. Add descriptions to explain what belongs in each category.</p>{message&&<Alert className={'nogna-settings-notice '+(/added|updated/i.test(message)?'is-success':'is-error')}>{message}</Alert>}<div className="nogna-settings-grid"><label className="nogna-field"><span>Category name</span><Input value={category.name} onChange={e=>setCategory({...category,name:e.target.value})} placeholder="e.g. Transport"/></label><label className="nogna-field"><span>Description</span><Textarea rows={2} value={category.description} onChange={e=>setCategory({...category,description:e.target.value})} placeholder="What belongs in this category?"/></label></div><div className="nogna-form-actions"><Button className="nogna-save-button" onClick={save}>{editing?'Update category':'Add category'}</Button>{editing&&<Button variant="secondary" onClick={()=>{setEditing(null);setCategory({name:'',description:''})}}>Cancel</Button>}</div><div className="nogna-expense-category-list">{categories.map(x=><div className="nogna-expense-category-row" key={x.id}><div><strong>{x.name}</strong><small>{x.description||'No description'}</small></div><Button variant="ghost" size="sm" onClick={()=>{setEditing(Number(x.id));setCategory({name:x.name,description:x.description||''})}}>Edit</Button></div>)}</div></section>;
}
