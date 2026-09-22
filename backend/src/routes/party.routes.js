const express=require('express');const router=express.Router();const{PrismaClient}=require('@prisma/client');const prisma=new PrismaClient();
router.get('/',async(req,res)=>{try{res.json(await prisma.party.findMany({orderBy:{createdAt:'desc'}}));}catch(e){res.status(500).json({error:e.message});}});
router.get('/:id',async(req,res)=>{try{const p=await prisma.party.findUnique({where:{id:Number(req.params.id)}});if(!p)return res.status(404).json({error:'Not found'});res.json(p);}catch(e){res.status(500).json({error:e.message});}});
router.post('/',async(req,res)=>{try{res.status(201).json(await prisma.party.create({data:req.body}));}catch(e){res.status(400).json({error:e.message});}});
router.put('/:id',async(req,res)=>{try{res.json(await prisma.party.update({where:{id:Number(req.params.id)},data:req.body}));}catch(e){res.status(400).json({error:e.message});}});
router.delete('/:id',async(req,res)=>{try{await prisma.party.delete({where:{id:Number(req.params.id)}});res.json({message:'Deleted'});}catch(e){res.status(400).json({error:e.message});}});
module.exports=router;
