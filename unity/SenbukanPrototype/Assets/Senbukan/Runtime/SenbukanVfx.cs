using System.Collections.Generic;
using UnityEngine;
namespace Dedilho.Senbukan
{
    public sealed class SenbukanVfx : MonoBehaviour
    {
        sealed class Effect
        {
            public LineRenderer Line; public float Until, Duration, Radius, Speed; public Vector3 Center, Normal, Motion; public Color Color;
        }
        static SenbukanVfx instance;
        static Material material;
        readonly List<Effect> effects = new List<Effect>();
        const int Budget = 56, Segments = 24;
        public static Material Glow
        {
            get
            {
                if (!material) { Material source = Resources.Load<Material>("Senbukan/Glow"); if (source) material = new Material(source); else { Shader shader = Shader.Find("Senbukan/Glow"); if (!shader) shader = Shader.Find("Sprites/Default"); material = new Material(shader); } }
                return material;
            }
        }
        static SenbukanVfx Instance
        {
            get { if (!instance) instance = new GameObject("Senbukan visual effects").AddComponent<SenbukanVfx>(); return instance; }
        }
        Effect Acquire()
        {
            foreach (Effect effect in effects) if (!effect.Line.gameObject.activeSelf) return effect;
            if (effects.Count >= Budget) return null;
            GameObject go = new GameObject("Pooled pressure ring"); go.transform.SetParent(transform);
            LineRenderer line = go.AddComponent<LineRenderer>(); line.sharedMaterial = Glow; line.loop = true; line.positionCount = Segments;
            line.useWorldSpace = true; line.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off; line.receiveShadows = false;
            var e = new Effect { Line = line }; effects.Add(e); return e;
        }
        static void Ring(Vector3 center, Vector3 normal, Color color, float radius, float speed, float duration, Vector3 motion)
        {
            Effect e = Instance.Acquire(); if (e == null) return;
            e.Center = center; e.Normal = normal.normalized; e.Color = color; e.Radius = radius; e.Speed = speed;
            e.Duration = duration; e.Until = Time.time + duration; e.Motion = motion; e.Line.gameObject.SetActive(true);
        }
        public static void Burst(Vector3 point, Color color, float strength)
        {
            Ring(point, Camera.main ? -Camera.main.transform.forward : Vector3.forward, color, .08f, 3.5f * strength, .25f, Vector3.zero);
            Ring(point, Vector3.up, color, .08f, 4.3f * strength, .32f, Vector3.zero);
            Ring(point, Vector3.right, color, .06f, 2.5f * strength, .2f, Vector3.zero);
        }
        public static void Strike(Vector3 point, Vector3 direction, Color color)
        {
            Ring(point, direction, color, .16f, 2, .18f, direction * 2);
        }
        public static void Dust(Vector3 foot, Vector3 direction, Color color)
        {
            Ring(foot + Vector3.up * .045f, Vector3.up, new Color(color.r, color.g, color.b, .45f), .1f, .8f, .35f, direction * .9f);
        }
        public static void Land(Vector3 foot, Color color)
        {
            Ring(foot + Vector3.up * .045f, Vector3.up, color, .2f, 3.3f, .4f, Vector3.zero);
            Ring(foot + Vector3.up * .055f, Vector3.up, color, .12f, 1.8f, .32f, Vector3.zero);
        }
        public static GameObject CreateAura(Transform parent, Color color)
        {
            GameObject root = new GameObject("Karate Prime aura"); root.transform.SetParent(parent, false);
            root.AddComponent<SenbukanAura>().Color = color; return root;
        }
        void Update()
        {
            foreach (Effect e in effects)
            {
                if (!e.Line.gameObject.activeSelf) continue;
                float remaining = e.Until - Time.time;
                if (remaining <= 0) { e.Line.gameObject.SetActive(false); continue; }
                float age = e.Duration - remaining, radius = e.Radius + age * e.Speed;
                Vector3 tangent = Vector3.Cross(e.Normal, Mathf.Abs(e.Normal.y) < .95f ? Vector3.up : Vector3.right).normalized;
                Vector3 side = Vector3.Cross(e.Normal, tangent);
                for (int i = 0; i < Segments; i++)
                {
                    float a = i * Mathf.PI * 2 / Segments;
                    e.Line.SetPosition(i, e.Center + e.Motion * age + (tangent * Mathf.Cos(a) + side * Mathf.Sin(a)) * radius);
                }
                Color color = e.Color; color.a *= remaining / e.Duration;
                e.Line.startColor = e.Line.endColor = color; e.Line.startWidth = e.Line.endWidth = .015f + remaining * .07f;
            }
        }
        void OnDestroy() { if (instance == this) { instance = null; if (material) Destroy(material); material = null; } }
    }
    public sealed class SenbukanAura : MonoBehaviour
    {
        public Color Color;
        LineRenderer ring, outline;
        void Start() { ring = Make("Ground energy", 32); outline = Make("Rising energy", 32); }
        LineRenderer Make(string name, int count)
        {
            var go = new GameObject(name); go.transform.SetParent(transform, false); var line = go.AddComponent<LineRenderer>();
            line.sharedMaterial = SenbukanVfx.Glow; line.useWorldSpace = false; line.loop = true; line.positionCount = count;
            line.startWidth = line.endWidth = .025f; return line;
        }
        void Update()
        {
            if (!ring || !outline) return;
            for (int i = 0; i < 32; i++)
            {
                float a = i * Mathf.PI / 16;
                ring.SetPosition(i, new Vector3(Mathf.Cos(a) * .7f, .04f, Mathf.Sin(a) * .7f));
                float pulse = .035f * Mathf.Sin(Time.time * 10 + i * 2);
                outline.SetPosition(i, new Vector3(Mathf.Cos(a) * (.56f + pulse), .95f + Mathf.Sin(a) * 1.03f, .05f));
            }
            Color color = Color; color.a = .7f; ring.startColor = ring.endColor = color; color.a = .4f; outline.startColor = outline.endColor = color;
        }
    }
}
