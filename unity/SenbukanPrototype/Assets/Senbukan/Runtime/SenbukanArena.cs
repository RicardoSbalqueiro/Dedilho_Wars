using System.Collections.Generic;
using System.Runtime.InteropServices;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using UnityEngine.Rendering;

namespace Dedilho.Senbukan
{
    public sealed class SenbukanArena : MonoBehaviour
    {
        public SenbukanFighter Player { get; private set; }
        public SenbukanFighter Opponent { get; private set; }
        public SenbukanCamera CameraRig { get; private set; }
        public bool Locked { get; private set; } = true;
        public bool StaticDummy { get; private set; }
        public bool Running { get { return !paused && focused && Player && Opponent && Player.HP > 0 && Opponent.HP > 0; } }
        bool paused, focused = true, ended;
        Font font;
        Text playerHP, opponentHP, message, prime, status;
        Image hp1, hp2, guard1, guard2, energy;
        GameObject resultPanel;
        float messageUntil;
        AudioSource sound;
        readonly Dictionary<int, AudioClip> sounds = new Dictionary<int, AudioClip>();
        static readonly Color Orange = new Color(1, .53f, .11f);
#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")] static extern void SenbukanExit();
#endif
        void Awake()
        {
            Application.targetFrameRate = 60; QualitySettings.vSyncCount = 0;
            QualitySettings.shadows = ShadowQuality.HardOnly; QualitySettings.shadowDistance = 28;
            RenderSettings.ambientMode = AmbientMode.Flat; RenderSettings.ambientLight = new Color(.4f, .32f, .48f);
            RenderSettings.fog = true; RenderSettings.fogColor = new Color(.065f, .025f, .12f);
            RenderSettings.fogMode = FogMode.Linear; RenderSettings.fogStartDistance = 38; RenderSettings.fogEndDistance = 150;
            GameObject dojo = Resources.Load<GameObject>("Senbukan/Dojo");
            GameObject caetano = Resources.Load<GameObject>("Senbukan/CaetanoFighter");
            GameObject student = Resources.Load<GameObject>("Senbukan/StudentFighter");
            if (!dojo || !caetano || !student)
            {
                Debug.LogError("Senbukan: prepare os prefabs em Dedilho Wars > Preparar cena Senbukan antes de executar.");
                enabled = false; return;
            }
            Instantiate(dojo, Vector3.zero, Quaternion.identity);
            Floor("Arena collision floor", new Vector3(0, .09f, 0), new Vector3(23, .2f, 23));
            Floor("North boundary", new Vector3(0, 2, 10.1f), new Vector3(21, 4, .25f));
            Floor("South boundary", new Vector3(0, 2, -10.1f), new Vector3(21, 4, .25f));
            Floor("East boundary", new Vector3(10.1f, 2, 0), new Vector3(.25f, 4, 21));
            Floor("West boundary", new Vector3(-10.1f, 2, 0), new Vector3(.25f, 4, 21));
            GameObject lightObject = new GameObject("Golden moonlight");
            Light key = lightObject.AddComponent<Light>(); key.type = LightType.Directional; key.color = new Color(1, .85f, .69f); key.intensity = 1.1f;
            key.shadows = LightShadows.Hard; lightObject.transform.rotation = Quaternion.Euler(38, -35, 0);
            GameObject cameraObject = new GameObject("Arena camera"); cameraObject.tag = "MainCamera";
            Camera camera = cameraObject.AddComponent<Camera>(); camera.fieldOfView = 56; camera.nearClipPlane = .08f; camera.farClipPlane = 180;
            camera.backgroundColor = new Color(.024f, .012f, .065f); camera.clearFlags = CameraClearFlags.SolidColor;
            cameraObject.AddComponent<AudioListener>(); CameraRig = cameraObject.AddComponent<SenbukanCamera>(); CameraRig.Arena = this;
            Player = CreateFighter(caetano, true); Opponent = CreateFighter(student, false); Player.Opponent = Opponent; Opponent.Opponent = Player;
            cameraObject.transform.position = new Vector3(0, 3, -9); sound = gameObject.AddComponent<AudioSource>(); sound.spatialBlend = 0; sound.volume = .42f;
            BuildHUD(); Restart(); Notify("CAETANO × ALUNO DO SENBUKAN");
        }
        void Floor(string name, Vector3 position, Vector3 size)
        {
            var go = new GameObject(name); go.layer = 8; go.transform.position = position; var box = go.AddComponent<BoxCollider>(); box.size = size;
        }
        SenbukanFighter CreateFighter(GameObject prefab, bool player)
        {
            GameObject root = new GameObject(player ? "Karate Caetano" : "Dojo Student");
            root.AddComponent<CharacterController>(); var fighter = root.AddComponent<SenbukanFighter>();
            fighter.Initialize(this, player, Instantiate(prefab)); return fighter;
        }
        public void Restart()
        {
            if (!Player || !Opponent) return;
            paused = false; ended = false; Time.timeScale = focused ? 1 : 0; SenbukanInput.Clear();
            Player.ResetAt(new Vector3(0, .23f, -2.8f), Quaternion.identity);
            Opponent.ResetAt(new Vector3(0, .23f, 2.8f), Quaternion.Euler(0, 180, 0));
            if (resultPanel) resultPanel.SetActive(false);
        }
        void Update()
        {
            if (!Player || !Opponent) return;
            if (Input.GetKeyDown(KeyCode.R)) Restart();
            if (Input.GetKeyDown(KeyCode.T)) { StaticDummy = !StaticDummy; Notify(StaticDummy ? "ALUNO PARADO · TREINO" : "COMBATE ATIVO"); }
            if (Input.GetKeyDown(KeyCode.Q)) Locked = !Locked;
            if (Input.GetKeyDown(KeyCode.P) || Input.GetKeyDown(KeyCode.Escape)) TogglePause();
            hp1.fillAmount = Player.HP / Player.MaxHP; hp2.fillAmount = Opponent.HP / Opponent.MaxHP;
            guard1.fillAmount = Player.Guard / 100; guard2.fillAmount = Opponent.Guard / 100; energy.fillAmount = Player.Energy / 100;
            playerHP.text = Mathf.CeilToInt(Player.HP) + " / " + Player.MaxHP;
            opponentHP.text = Mathf.CeilToInt(Opponent.HP) + " / " + Opponent.MaxHP;
            prime.text = Player.Prime ? "KARATÊ PRIME  " + Player.PrimeTime.ToString("0.0") + "s" : "ENERGIA  " + Mathf.FloorToInt(Player.Energy);
            status.text = paused ? "PAUSADO" : !focused ? "JOGO EM SEGUNDO PLANO" : (Locked ? "ALVO FIXO" : "CÂMERA LIVRE") + (StaticDummy ? " · ALUNO PARADO" : " · COMBATE");
            if (message && Time.unscaledTime > messageUntil && !ended) message.text = "";
        }
        public void TogglePause() { paused = !paused; Time.timeScale = paused || !focused ? 0 : 1; SenbukanInput.Clear(); }
        void OnApplicationFocus(bool focus) { focused = focus; Time.timeScale = focused && !paused ? 1 : 0; SenbukanInput.Clear(); }
        public void OnKnockout(SenbukanFighter defeated)
        {
            if (ended) return; ended = true; SenbukanInput.Clear();
            Notify(defeated.IsPlayer ? "O TREINO CONTINUA." : "DISCIPLINA. PRECISÃO. IMPACTO.");
            if (resultPanel) resultPanel.SetActive(true);
        }
        public void Notify(string text) { if (message) message.text = text; messageUntil = Time.unscaledTime + 2.7f; }
        public void Sound(int tone, float duration)
        {
            if (!sound) return;
            if (!sounds.ContainsKey(tone))
            {
                int count = Mathf.CeilToInt(22050 * .25f); float[] samples = new float[count];
                for (int i = 0; i < count; i++)
                {
                    float t = i / 22050f, envelope = Mathf.Exp(-t * 25);
                    samples[i] = (Mathf.Sin(t * tone * Mathf.PI * 2 * (1 - t * 1.5f)) + (Mathf.PerlinNoise(i * .17f, tone) - .5f) * .6f) * envelope * .25f;
                }
                AudioClip clip = AudioClip.Create("Senbukan contact " + tone, count, 1, 22050, false); clip.SetData(samples, 0); sounds[tone] = clip;
            }
            sound.PlayOneShot(sounds[tone], Mathf.Clamp(duration * 7, .2f, .9f));
        }
        public void Exit()
        {
            Time.timeScale = 1; SenbukanInput.Clear();
#if UNITY_WEBGL && !UNITY_EDITOR
            SenbukanExit();
#else
            Notify("Use a janela do Editor para encerrar o teste.");
#endif
        }
        void OnDestroy() { Time.timeScale = 1; SenbukanInput.Clear(); foreach (var clip in sounds.Values) if (clip) Destroy(clip); }
        RectTransform Rect(string name, Transform parent, Vector2 anchor, Vector2 pivot, Vector2 position, Vector2 size)
        {
            var go = new GameObject(name, typeof(RectTransform)); var r = go.GetComponent<RectTransform>(); r.SetParent(parent, false);
            r.anchorMin = r.anchorMax = anchor; r.pivot = pivot; r.anchoredPosition = position; r.sizeDelta = size; return r;
        }
        Text Label(string name, Transform parent, string value, Vector2 anchor, Vector2 pivot, Vector2 pos, Vector2 size, int fontSize, TextAnchor align)
        {
            var r = Rect(name, parent, anchor, pivot, pos, size); Text text = r.gameObject.AddComponent<Text>(); text.font = font;
            text.text = value; text.fontSize = fontSize; text.fontStyle = FontStyle.Bold; text.alignment = align; text.color = new Color(1, .96f, .88f); text.raycastTarget = false; return text;
        }
        Image Bar(string name, Transform parent, Vector2 anchor, Vector2 pivot, Vector2 pos, Vector2 size, Color color)
        {
            var back = Rect(name, parent, anchor, pivot, pos, size); back.gameObject.AddComponent<Image>().color = new Color(.035f, .015f, .065f, .9f);
            var fill = Rect("Fill", back, Vector2.zero, Vector2.zero, Vector2.one * 2, size - Vector2.one * 4);
            Image image = fill.gameObject.AddComponent<Image>(); image.color = color; image.type = Image.Type.Filled; image.fillMethod = Image.FillMethod.Horizontal; image.raycastTarget = false;
            // UI Filled requires a sprite; Unity's built-in white texture supplies one.
            image.sprite = Sprite.Create(Texture2D.whiteTexture, new UnityEngine.Rect(0, 0, Texture2D.whiteTexture.width, Texture2D.whiteTexture.height), Vector2.one * .5f);
            return image;
        }
        Button Button(string title, Transform parent, Vector2 anchor, Vector2 pivot, Vector2 pos, Vector2 size, UnityEngine.Events.UnityAction action)
        {
            var r = Rect(title, parent, anchor, pivot, pos, size); r.gameObject.AddComponent<Image>().color = new Color(.07f, .025f, .13f, .88f);
            var button = r.gameObject.AddComponent<Button>(); button.onClick.AddListener(action);
            Label("Label", r, title, Vector2.one * .5f, Vector2.one * .5f, Vector2.zero, size, 18, TextAnchor.MiddleCenter); return button;
        }
        void BuildHUD()
        {
            try { font = Resources.GetBuiltinResource<Font>("Arial.ttf"); } catch { font = null; } if (!font) font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            GameObject root = new GameObject("Senbukan HUD", typeof(RectTransform)); var canvas = root.AddComponent<Canvas>(); canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scale = root.AddComponent<CanvasScaler>(); scale.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scale.referenceResolution = new Vector2(1280, 720); scale.matchWidthOrHeight = .5f;
            root.AddComponent<GraphicRaycaster>(); if (!FindObjectOfType<EventSystem>()) new GameObject("UI Event System", typeof(EventSystem), typeof(StandaloneInputModule));
            var left = new Vector2(0, 1); var right = Vector2.one;
            Label("Player name", root.transform, "KARATÊ CAETANO", left, left, new Vector2(28, -20), new Vector2(430, 36), 26, TextAnchor.MiddleLeft);
            Label("Opponent name", root.transform, "ALUNO DO SENBUKAN", right, right, new Vector2(-28, -20), new Vector2(430, 36), 26, TextAnchor.MiddleRight);
            hp1 = Bar("Player HP", root.transform, left, left, new Vector2(28, -62), new Vector2(435, 26), Orange);
            hp2 = Bar("Opponent HP", root.transform, right, right, new Vector2(-28, -62), new Vector2(435, 26), new Color(.57f, .32f, .96f));
            guard1 = Bar("Player guard", root.transform, left, left, new Vector2(28, -96), new Vector2(300, 8), new Color(.42f, .83f, 1));
            guard2 = Bar("Opponent guard", root.transform, right, right, new Vector2(-28, -96), new Vector2(300, 8), new Color(.42f, .83f, 1));
            playerHP = Label("HP number", root.transform, "", left, left, new Vector2(32, -62), new Vector2(420, 26), 16, TextAnchor.MiddleLeft);
            opponentHP = Label("HP number", root.transform, "", right, right, new Vector2(-32, -62), new Vector2(420, 26), 16, TextAnchor.MiddleRight);
            Label("Stage", root.transform, "SENBUKAN", new Vector2(.5f, 1), new Vector2(.5f, 1), new Vector2(0, -18), new Vector2(300, 35), 26, TextAnchor.MiddleCenter);
            status = Label("Status", root.transform, "", new Vector2(.5f, 1), new Vector2(.5f, 1), new Vector2(0, -58), new Vector2(340, 36), 14, TextAnchor.MiddleCenter);
            message = Label("Combat message", root.transform, "", new Vector2(.5f, .72f), Vector2.one * .5f, Vector2.zero, new Vector2(1000, 70), 28, TextAnchor.MiddleCenter);
            energy = Bar("Energy", root.transform, Vector2.zero, Vector2.zero, new Vector2(28, 36), new Vector2(340, 16), Orange);
            prime = Label("Prime timer", root.transform, "", Vector2.zero, Vector2.zero, new Vector2(28, 56), new Vector2(360, 30), 19, TextAnchor.MiddleLeft);
            Button("VOLTAR", root.transform, new Vector2(.5f, 0), new Vector2(.5f, 0), new Vector2(0, 23), new Vector2(130, 40), Exit);
            Button("PAUSA", root.transform, new Vector2(.5f, 1), new Vector2(.5f, 1), new Vector2(0, -108), new Vector2(120, 36), TogglePause);
            resultPanel = new GameObject("Round result", typeof(RectTransform)); var rr = resultPanel.GetComponent<RectTransform>(); rr.SetParent(root.transform, false); rr.anchorMin = rr.anchorMax = rr.pivot = Vector2.one * .5f; rr.sizeDelta = new Vector2(420, 100); rr.anchoredPosition = new Vector2(0, -70);
            Button("TREINAR NOVAMENTE", rr, Vector2.one * .5f, Vector2.one * .5f, Vector2.zero, new Vector2(360, 66), Restart); resultPanel.SetActive(false);
            bool touch = Application.isMobilePlatform || Input.touchSupported;
            if (!touch) Label("Keyboard controls", root.transform, "WASD MOVER · J SOCO · K CHUTE · E DEFESA · SHIFT DASH · ESPAÇO PULO · U DEDILHO · F PRIME · Q ALVO · T ALUNO PARADO · R REINICIAR", new Vector2(.5f, 0), new Vector2(.5f, 0), new Vector2(0, 98), new Vector2(1220, 38), 14, TextAnchor.MiddleCenter);
            if (touch) BuildTouch(root.transform);
        }
        void BuildTouch(Transform parent)
        {
            var stick = Rect("Movement pad", parent, Vector2.zero, Vector2.zero, new Vector2(35, 105), new Vector2(175, 175)); stick.gameObject.AddComponent<Image>().color = new Color(.08f, .03f, .15f, .65f);
            var knob = Rect("Stick knob", stick, Vector2.one * .5f, Vector2.one * .5f, Vector2.zero, new Vector2(65, 65)); knob.gameObject.AddComponent<Image>().color = new Color(1, .66f, .25f, .75f); knob.GetComponent<Image>().raycastTarget = false;
            stick.gameObject.AddComponent<SenbukanStick>().Knob = knob;
            string[] labels = { "SOCO", "CHUTE", "DASH", "PULO", "DEDILHO", "PRIME", "DEFESA" };
            SenbukanInput.Button[] commands = { SenbukanInput.Button.Punch, SenbukanInput.Button.Kick, SenbukanInput.Button.Dash, SenbukanInput.Button.Jump, SenbukanInput.Button.Special, SenbukanInput.Button.Transform, SenbukanInput.Button.Punch };
            for (int i = 0; i < labels.Length; i++)
            {
                Vector2 position = new Vector2(-24 - (i % 3) * 105, 96 + (i / 3) * 94);
                var r = Rect(labels[i], parent, new Vector2(1, 0), new Vector2(1, 0), position, new Vector2(96, 82));
                r.gameObject.AddComponent<Image>().color = new Color(.055f, .025f, .1f, .84f);
                var button = r.gameObject.AddComponent<SenbukanTouchButton>(); button.Command = commands[i]; button.IsGuard = i == 6;
                Label("Label", r, labels[i], Vector2.one * .5f, Vector2.one * .5f, Vector2.zero, new Vector2(96, 82), 18, TextAnchor.MiddleCenter);
            }
        }
    }
}
