Shader "Senbukan/Toon"
{
 Properties { _Color ("Color", Color) = (1,1,1,1) _OutlineColor ("Ink", Color) = (.055,.025,.065,1) _OutlineWidth ("Outline width", Range(0,.025)) = .006 _GlowColor ("Energy glow", Color) = (0,0,0,0) }
 SubShader
 {
  Tags { "RenderType"="Opaque" }
  Pass
  {
   Name "Ink" Cull Front
   CGPROGRAM
   #pragma vertex vert
   #pragma fragment frag
   #include "UnityCG.cginc"
   float _OutlineWidth; fixed4 _OutlineColor;
   struct input { float4 vertex:POSITION; float3 normal:NORMAL; };
   float4 vert(input v):SV_POSITION { v.vertex.xyz += v.normal * _OutlineWidth; return UnityObjectToClipPos(v.vertex); }
   fixed4 frag():SV_Target { return _OutlineColor; }
   ENDCG
  }
  Pass
  {
   Tags { "LightMode"="ForwardBase" }
   CGPROGRAM
   #pragma vertex vert
   #pragma fragment frag
   #pragma multi_compile_fwdbase
   #include "UnityCG.cginc"
   #include "Lighting.cginc"
   #include "AutoLight.cginc"
   fixed4 _Color, _GlowColor;
   struct input { float4 vertex:POSITION; float3 normal:NORMAL; };
   struct vary { float4 pos:SV_POSITION; float3 normal:TEXCOORD0; float3 world:TEXCOORD1; SHADOW_COORDS(2) };
   vary vert(input v) { vary o; o.pos=UnityObjectToClipPos(v.vertex); o.world=mul(unity_ObjectToWorld,v.vertex).xyz; o.normal=UnityObjectToWorldNormal(v.normal); TRANSFER_SHADOW(o); return o; }
   fixed4 frag(vary i):SV_Target
   {
    float n=dot(normalize(i.normal),normalize(_WorldSpaceLightPos0.xyz));
    float ramp=n>.6?1:n>.05?.76:.48; float shadow=SHADOW_ATTENUATION(i);
    float3 light=UNITY_LIGHTMODEL_AMBIENT.rgb*.6+_LightColor0.rgb*ramp*lerp(.62,1,shadow);
    float rim=pow(1-saturate(dot(normalize(_WorldSpaceCameraPos-i.world),normalize(i.normal))),3)*.07;
    return fixed4(_Color.rgb*light+rim*_Color.rgb+_GlowColor.rgb*_GlowColor.a,1);
   }
   ENDCG
  }
  UsePass "Legacy Shaders/VertexLit/SHADOWCASTER"
 }
 Fallback "Diffuse"
}
