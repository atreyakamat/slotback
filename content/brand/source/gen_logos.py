import math
G="#0F2E22"; INK="#07140F"; L="#C6F432"; C="#F5EFE1"

def arc_arrow(cx,cy,r,a1,a2,sw,color,head=1.0):
    # clockwise arc (screen coords) from a1 to a2 degrees, arrowhead at a2
    t1,t2=math.radians(a1),math.radians(a2)
    x1,y1=cx+r*math.cos(t1),cy+r*math.sin(t1)
    x2,y2=cx+r*math.cos(t2),cy+r*math.sin(t2)
    large=1 if (a2-a1)%360>180 else 0
    path=f'<path d="M{x1:.1f} {y1:.1f} A{r} {r} 0 {large} 1 {x2:.1f} {y2:.1f}" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round"/>'
    # arrowhead: triangle pointing along tangent
    tx,ty=-math.sin(t2),math.cos(t2)
    nx,ny=math.cos(t2),math.sin(t2)
    hl=sw*1.25*head; hw=sw*1.15*head
    tip=(x2+tx*hl,y2+ty*hl)
    b1=(x2+nx*hw,y2+ny*hw); b2=(x2-nx*hw,y2-ny*hw)
    tri=f'<path d="M{tip[0]:.1f} {tip[1]:.1f} L{b1[0]:.1f} {b1[1]:.1f} L{b2[0]:.1f} {b2[1]:.1f} Z" fill="{color}" stroke="{color}" stroke-width="{sw*0.25:.0f}" stroke-linejoin="round"/>'
    return path+tri

def calendar(cx,cy,w,h,color,sw,fill="none",check=None,tabs=True):
    x,y=cx-w/2,cy-h/2
    s=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{w*0.16}" fill="{fill}" stroke="{color}" stroke-width="{sw}"/>'
    s+=f'<line x1="{x}" y1="{y+h*0.3}" x2="{x+w}" y2="{y+h*0.3}" stroke="{color}" stroke-width="{sw}"/>'
    if tabs:
        for fx in (0.3,0.7):
            s+=f'<line x1="{x+w*fx}" y1="{y-sw*1.1}" x2="{x+w*fx}" y2="{y+sw*0.6}" stroke="{color}" stroke-width="{sw}" stroke-linecap="round"/>'
    if check:
        ccol=check
        s+=(f'<path d="M{x+w*0.29} {y+h*0.64} L{x+w*0.44} {y+h*0.79} L{x+w*0.73} {y+h*0.5}" fill="none" stroke="{ccol}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>')
    return s

def svg(body,bg):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">'
            f'<rect width="1080" height="1080" fill="{bg}"/>{body}</svg>')

# A: Slot filled — the reel's calendar-check mark, centred for a circle crop
A=svg(calendar(540,575,500,450,G,70,check=G),L)

# B: Slot back — calendar wrapped by a return arrow
B=svg(arc_arrow(540,540,375,-70,215,62,L)+calendar(540,560,330,290,C,48,check=L),G)

# C: Chair — salon chair inside a return arrow
def chair(cx,cy,s,col):
    # side-profile barber chair in a 200x230 box scaled by s
    ox,oy=cx-100*s,cy-115*s
    P=lambda x,y:f"{ox+x*s:.1f} {oy+y*s:.1f}"
    def R(x,y,w,h,rx,rot=0,rc=None):
        t=f' transform="rotate({rot} {ox+rc[0]*s:.1f} {oy+rc[1]*s:.1f})"' if rot else ""
        return f'<rect x="{ox+x*s:.1f}" y="{oy+y*s:.1f}" width="{w*s:.1f}" height="{h*s:.1f}" rx="{rx*s:.1f}" fill="{col}"{t}/>'
    sw=20*s
    return (R(30,10,46,118,18,-10,(53,120))            # backrest
            +R(26,-14,40,30,14,-10,(46,1))             # headrest
            +R(26,104,134,42,18)                      # seat
            +R(62,74,94,24,12)                         # armrest
            +R(130,90,20,20,0)                        # armrest post
            +f'<path d="M{P(150,132)} L{P(176,178)} L{P(196,178)}" fill="none" stroke="{col}" stroke-width="{sw:.1f}" stroke-linecap="round" stroke-linejoin="round"/>'  # footrest
            +R(80,140,28,56,0)                        # column
            +R(34,190,120,28,14))                     # base
Cc=svg(arc_arrow(540,540,375,-70,215,62,G)+chair(530,565,2.0,G),L)

for n,s in (("A",A),("B",B),("C",Cc)):
    open(f"logo-{n}.svg","w").write(s)
