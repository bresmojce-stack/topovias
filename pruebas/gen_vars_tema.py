# Regenera las variables de tema (t, b, l) para cada color usado como var(--tHEX)/var(--bHEX)/var(--lHEX)
import re, colorsys
p='/home/user/topovias/index.html'; s=open(p).read()
i=s.index('  :root { color-scheme: light;'); j=s.index('\n',s.index('  html[data-tema="oscuro"] { color-scheme: dark;'))
bloque=s[i:j]
hexes=sorted(set(re.findall(r'var\(--[tbl]([0-9A-F]{6})\)', s[:i]+s[j:]))|set(re.findall(r'--[tbl]([0-9A-F]{6}):', bloque)))
def hls(x): r,g,b=[int(x[k:k+2],16)/255 for k in (0,2,4)]; return colorsys.rgb_to_hls(r,g,b)
def hexd(h,l,sat): r,g,b=colorsys.hls_to_rgb(h,max(0,min(1,l)),max(0,min(1,sat))); return '#%02X%02X%02X'%(round(r*255),round(g*255),round(b*255))
PANEL,CAMPO,SEC,BORDE,BORDE2,TXT,TXT2='#1B2534','#192433','#263449','#3A4A60','#53667D','#F1F5F9','#B9C7D8'
def oscuro(t,x):
    h,l,sat=hls(x)
    if t=='b':
        if x in ('FFFFFF','FAFAFA','F9FAFB'): return PANEL
        if x=='F8FAFC': return CAMPO
        if x in ('F1F5F9','F3F4F6'): return SEC
        if l>=0.80: return SEC if sat<0.25 else hexd(h,0.21,min(sat,0.5)*0.6)
        if l>=0.58: return hexd(h,0.30,sat*0.6)
        return '#'+x
    if t=='t':
        if l>=0.78: return '#'+x
        if sat<0.2: return TXT if l<0.32 else TXT2
        return hexd(h,0.74 if l<0.5 else 0.70,sat)
    if l>=0.75: return BORDE if sat<0.25 else hexd(h,0.40,sat*0.6)
    if l<0.30 and sat<0.25: return BORDE2
    return '#'+x
cc=re.findall(r'--c-[a-zA-Z0-9-]+: #[0-9A-F]{6};', bloque.split('html[data-tema')[0])
co=re.findall(r'--c-[a-zA-Z0-9-]+: #[0-9A-F]{6};', bloque.split('html[data-tema')[1])
claro=' '.join(f'--{t}{x}: #{x};' for x in hexes for t in 'tbl')
osc=' '.join(f'--{t}{x}: {oscuro(t,x)};' for x in hexes for t in 'tbl')
s=s[:i]+f'  :root {{ color-scheme: light; {" ".join(cc)} {claro} }}\n  html[data-tema="oscuro"] {{ color-scheme: dark; {" ".join(co)} {osc} }}'+s[j:]
open(p,'w').write(s); print('colores', len(hexes))
