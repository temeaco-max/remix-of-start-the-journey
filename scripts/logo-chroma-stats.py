from PIL import Image
from statistics import quantiles
im=Image.open('/home/ubuntu/upload/pasted_file_Hpq4At_image.png').convert('RGB')
values=[]
for r,g,b in im.getdata():
    values.append(max(0,(r-g)*3+(r-b)*2-24))
values.sort()
for q in [0.5,0.75,0.9,0.95,0.97,0.98,0.99,0.995,1.0]:
    print(q, values[min(len(values)-1,int(q*(len(values)-1)))])
print('pixels > 80',sum(v>80 for v in values),'of',len(values))
