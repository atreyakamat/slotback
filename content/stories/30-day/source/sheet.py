import sys
from PIL import Image
src,dst,start,n,cols,w=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4]),int(sys.argv[5]),int(sys.argv[6])
h=int(w*16/9); rows=(n+cols-1)//cols; g=16
S=Image.new("RGB",(cols*(w+g)+g,rows*(h+g)+g),"#222")
for i in range(n):
    im=Image.open(f"{src}/day-{start+i:02d}.png").resize((w,h),Image.LANCZOS)
    S.paste(im,(g+(i%cols)*(w+g),g+(i//cols)*(h+g)))
S.save(dst)
