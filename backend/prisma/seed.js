const{PrismaClient}=require('@prisma/client');const prisma=new PrismaClient();
async function main(){
  await prisma.party.createMany({data:[
    {type:'CASH',cashPartyName:'Ahmed Textiles',cashAddress:'Yarn Market, Faisalabad',cashCell:'03001234567',ipConcernPerson:'Mr. Ahmed',ipCell:'03001234567'},
    {type:'GST',gstPartyName:'Malik Yarn Trading Co.',strn:'1234567890123',ntn:'0987654',gstAddress:'Yarn Market, Faisalabad',gstCell:'03111234567',ipConcernPerson:'Mr. Malik',ipCell:'03111234567',cpConcernPerson:'Mr. Bilal',cpCell:'03211234567'}
  ]});
  await prisma.item.createMany({data:[
    {category:'COUNT',name:'20s Single Combed',box1:'20',box2:'Single',box3:'Combed'},
    {category:'COUNT',name:'30s Single Carded',box1:'30',box2:'Single',box3:'Carded'},
    {category:'QUALITY',name:'Grade A Premium',box1:'A',box2:'Premium'},
    {category:'BG_YARN',name:'BG-100 Cotton',box1:'BG-100',box2:'100% Cotton'},
    {category:'FABRIC',name:'Plain Fabric 60"',box1:'Plain',box2:'60 inch'},
    {category:'GREY_CLOTH',name:'Grey Cloth 58"',box1:'Grey',box2:'58 inch'}
  ]});
  console.log('Seeded successfully');
}
main().catch(e=>{console.error(e);process.exit(1);}).finally(()=>prisma.$disconnect());
