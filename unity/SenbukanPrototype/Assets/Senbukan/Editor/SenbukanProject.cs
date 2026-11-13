using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using Dedilho.Senbukan;

namespace Dedilho.Senbukan.Editor
{
    [InitializeOnLoad]
    public static class SenbukanProject
    {
        const string Art = "Assets/Senbukan/Art/";
        const string ScenePath = "Assets/Scenes/SenbukanTest.unity";
        static bool preparing;
        static SenbukanProject() { EditorApplication.delayCall += FirstOpen; }
        static void FirstOpen()
        {
            if (EditorApplication.isCompiling || EditorApplication.isUpdating) { EditorApplication.delayCall += FirstOpen; return; }
            if (!File.Exists(ScenePath) && File.Exists(Art + "Caetano.fbx") && !SessionState.GetBool("SenbukanPrepared", false))
            { SessionState.SetBool("SenbukanPrepared", true); Prepare(); }
        }
        [MenuItem("Dedilho Wars/Preparar cena Senbukan")]
        public static void Prepare()
        {
            if (preparing || EditorApplication.isPlaying) return;
            preparing = true;
            try
            {
                Directory.CreateDirectory("Assets/Resources/Senbukan"); Directory.CreateDirectory("Assets/Senbukan/Materials"); Directory.CreateDirectory("Assets/Scenes");
                AssetDatabase.Refresh();
                Model("Caetano", "CaetanoFighter", true, 1.83f);
                Model("DojoStudent", "StudentFighter", true, 1.78f);
                Model("DojoSenbukan", "Dojo", false, 1);
                Shader glow = Shader.Find("Senbukan/Glow"); if (!glow) throw new Exception("Shader Senbukan/Glow ausente.");
                const string glowPath = "Assets/Resources/Senbukan/Glow.mat";
                if (!AssetDatabase.LoadAssetAtPath<Material>(glowPath)) AssetDatabase.CreateAsset(new Material(glow), glowPath);
                var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                new GameObject("Senbukan Arena Bootstrap").AddComponent<SenbukanArena>();
                EditorSceneManager.SaveScene(scene, ScenePath);
                EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
                PlayerSettings.companyName = "Dedilho Wars"; PlayerSettings.productName = "Senbukan Prototype"; PlayerSettings.bundleVersion = "0.1.0";
                PlayerSettings.defaultScreenWidth = 1280; PlayerSettings.defaultScreenHeight = 720; PlayerSettings.runInBackground = false;
                AssetDatabase.SaveAssets(); Debug.Log("Senbukan preparado. Abra a cena e pressione Play para validar o combate no Unity.");
            }
            finally { preparing = false; }
        }
        static void Model(string source, string name, bool animated, float height)
        {
            string path = Art + source + ".fbx";
            ModelImporter importer = AssetImporter.GetAtPath(path) as ModelImporter;
            if (!importer) throw new Exception("Modelo não encontrado: " + path);
            importer.importAnimation = animated; importer.globalScale = 1;
            if (animated) { importer.animationType = ModelImporterAnimationType.Legacy; importer.animationCompression = ModelImporterAnimationCompression.Off; importer.optimizeGameObjects = false; }
            importer.SaveAndReimport();
            GameObject model = AssetDatabase.LoadAssetAtPath<GameObject>(path); if (!model) throw new Exception("Falha ao importar " + path);
            GameObject wrapper = new GameObject(name); GameObject instance = UnityEngine.Object.Instantiate(model, wrapper.transform);
            instance.name = source;
            if (animated)
            {
                Bounds bounds = new Bounds(); bool first = true;
                foreach (Renderer r in instance.GetComponentsInChildren<Renderer>()) { if (first) { bounds = r.bounds; first = false; } else bounds.Encapsulate(r.bounds); }
                if (first || bounds.size.y < .1f) throw new Exception("Modelo sem altura válida: " + source);
                float unit = height / bounds.size.y; instance.transform.localScale *= unit;
                instance.transform.localPosition = Vector3.up * (-bounds.min.y * unit);
                foreach (Animator a in instance.GetComponentsInChildren<Animator>()) UnityEngine.Object.DestroyImmediate(a);
                Animation animation = instance.GetComponent<Animation>(); if (!animation) animation = instance.AddComponent<Animation>();
                AnimationClip[] clips = AssetDatabase.LoadAllAssetsAtPath(path).OfType<AnimationClip>().Where(c => !c.name.StartsWith("__preview__")).ToArray();
                foreach (AnimationClip clip in clips) animation.AddClip(clip, clip.name);
                foreach (string required in new[] { "idle", "run", "punch1", "punch2", "punch3", "kick", "guard", "hit", "jump", "dash", "transform" })
                    if (!clips.Any(c => c.name.ToLowerInvariant().Contains(required))) throw new Exception(source + ": clip ausente " + required);
                var idle = clips.First(c => c.name.ToLowerInvariant().Contains("idle")); animation.clip = idle; animation.playAutomatically = true;
                foreach (SkinnedMeshRenderer skinned in instance.GetComponentsInChildren<SkinnedMeshRenderer>()) skinned.updateWhenOffscreen = true;
            }
            AssignMaterials(instance, source);
            PrefabUtility.SaveAsPrefabAsset(wrapper, "Assets/Resources/Senbukan/" + name + ".prefab"); UnityEngine.Object.DestroyImmediate(wrapper);
        }
        static void AssignMaterials(GameObject model, string source)
        {
            Shader toon = Shader.Find("Senbukan/Toon"); if (!toon) throw new Exception("Shader Senbukan/Toon ausente.");
            foreach (Renderer renderer in model.GetComponentsInChildren<Renderer>())
            {
                Material[] materials = renderer.sharedMaterials;
                for (int i = 0; i < materials.Length; i++)
                {
                    Material old = materials[i]; if (!old) continue;
                    string safe = string.Concat(old.name.Select(c => char.IsLetterOrDigit(c) ? c : '_'));
                    string path = "Assets/Senbukan/Materials/" + source + "_" + safe + ".mat";
                    Material material = AssetDatabase.LoadAssetAtPath<Material>(path);
                    if (!material)
                    {
                        material = new Material(toon); material.color = old.HasProperty("_Color") ? old.color : Color.white;
                        string n = safe.ToLowerInvariant();
                        if (n.Contains("neon") || n.Contains("emiss") || n.Contains("lantern") || n.Contains("moon")) material.SetColor("_GlowColor", new Color(material.color.r, material.color.g, material.color.b, .8f));
                        material.SetFloat("_OutlineWidth", source == "DojoSenbukan" ? .009f : .004f); AssetDatabase.CreateAsset(material, path);
                    }
                    materials[i] = material;
                }
                renderer.sharedMaterials = materials;
            }
        }
        [MenuItem("Dedilho Wars/Gerar WebGL para a campanha")]
        public static void BuildWebGL()
        {
            Prepare();
            string destination = Path.GetFullPath(Path.Combine(Application.dataPath, "../../../public/senbukan/unity"));
            Directory.CreateDirectory(destination);
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip; PlayerSettings.WebGL.decompressionFallback = true;
            PlayerSettings.WebGL.template = "PROJECT:Senbukan";
            BuildReport report = BuildPipeline.BuildPlayer(new BuildPlayerOptions { scenes = new[] { ScenePath }, locationPathName = destination, target = BuildTarget.WebGL, options = BuildOptions.None });
            if (report.summary.result != BuildResult.Succeeded) throw new Exception("O build Unity WebGL falhou. O teste continua em preparação.");
            if (!File.Exists(Path.Combine(destination, "index.html"))) throw new Exception("Build sem index.html.");
            foreach (string file in Directory.GetFiles(destination, "*", SearchOption.AllDirectories))
                if (new FileInfo(file).Length >= 25 * 1024 * 1024) throw new Exception("Arquivo ultrapassa o limite da hospedagem: " + file);
            string manifest = "{\"state\":\"ready\",\"engine\":\"unity\",\"entry\":\"/senbukan/unity/index.html\",\"builtAtUtc\":\"" + DateTime.UtcNow.ToString("o") + "\"}";
            File.WriteAllText(Path.Combine(destination, "../build.json"), manifest);
            Debug.Log("Build Unity gerado. Execute os checks/build/package do site e publique a versão completa.");
        }
    }
}
