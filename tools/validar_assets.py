from pathlib import Path
from PIL import Image, ImageOps
import json,hashlib,argparse
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--optimize',action='store_true');args=p.parse_args()
manifest=json.loads((ROOT/'catalogo.json').read_text(encoding='utf8'))
report={'files':[],'duplicates':[],'missing':[],'warnings':[]}
seen={}
for item in manifest['items']:
 stem=item['id']
 for angle in ('front','side','60','45','25'):
  if angle in ('front','side'):path=ROOT/'assets/raw'/f'{stem}-{angle}.png'
  elif angle=='60':path=ROOT/'assets/candidatas_60'/f'{stem}-60-CANDIDATA.png'
  else:path=ROOT/'assets/aprobadas'/f'{stem}-{angle}.png'
  if not path.exists():report['missing'].append(str(path.relative_to(ROOT)));continue
  with Image.open(path) as im:
   w,h=im.size; ratio=w/h;digest=hashlib.sha256(path.read_bytes()).hexdigest()
   rec={'file':str(path.relative_to(ROOT)),'size':[w,h],'aspect_ratio':round(ratio,4),'sha256':digest,'status':'candidate' if angle=='60' else ('approved_reference' if angle in ('front','side') else 'needs_visual_approval')}
   if abs(ratio-.75)>.025:rec['warning']='Aspect ratio differs from 3:4';report['warnings'].append(rec['file']+': aspect ratio')
   if min(w,h)<700:rec['warning']='Low native resolution';report['warnings'].append(rec['file']+': low resolution')
   if digest in seen:report['duplicates'].append([seen[digest],rec['file']])
   else:seen[digest]=rec['file']
   report['files'].append(rec)
   if args.optimize:
    target=ROOT/'assets/optimized'/f'{stem}-{angle}.webp'; target.parent.mkdir(exist_ok=True)
    ImageOps.exif_transpose(im).convert('RGB').save(target,'WEBP',quality=88,method=6)
(ROOT/'reporte_validacion.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(f"Archivos: {len(report['files'])}; faltantes: {len(report['missing'])}; duplicados exactos: {len(report['duplicates'])}; alertas: {len(report['warnings'])}")
for f in report['missing']:print('FALTA',f)
for w in report['warnings']:print('AVISO',w)
