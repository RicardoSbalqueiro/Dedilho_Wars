Shader "Senbukan/Glow"
{
 Properties { _Color ("Color",Color)=(1,1,1,1) }
 SubShader
 {
  Tags { "Queue"="Transparent" "RenderType"="Transparent" }
  Blend SrcAlpha One ZWrite Off Cull Off
  Pass
  {
   CGPROGRAM
   #pragma vertex vert
   #pragma fragment frag
   #include "UnityCG.cginc"
   fixed4 _Color;
   struct input { float4 vertex:POSITION; fixed4 color:COLOR; };
   struct vary { float4 pos:SV_POSITION; fixed4 color:COLOR; };
   vary vert(input v) { vary o; o.pos=UnityObjectToClipPos(v.vertex); o.color=v.color*_Color; return o; }
   fixed4 frag(vary i):SV_Target { return i.color; }
   ENDCG
  }
 }
}
