using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Dedilho.Senbukan
{
    public static class SenbukanInput
    {
        public static Vector2 Stick;
        public static bool GuardHeld;
        static int pressed;
        public enum Button { Punch, Kick, Dash, Jump, Special, Transform }
        public static void Press(Button b) { pressed |= 1 << (int)b; }
        public static bool Take(Button b, KeyCode key)
        {
            int bit = 1 << (int)b;
            bool result = (pressed & bit) != 0 || UnityEngine.Input.GetKeyDown(key);
            pressed &= ~bit;
            return result;
        }
        public static Vector2 Movement
        {
            get
            {
                Vector2 keys = new Vector2((UnityEngine.Input.GetKey(KeyCode.D) ? 1 : 0) - (UnityEngine.Input.GetKey(KeyCode.A) ? 1 : 0),
                    (UnityEngine.Input.GetKey(KeyCode.W) ? 1 : 0) - (UnityEngine.Input.GetKey(KeyCode.S) ? 1 : 0));
                return Vector2.ClampMagnitude(keys.sqrMagnitude > .01f ? keys : Stick, 1);
            }
        }
        public static bool Guard { get { return GuardHeld || UnityEngine.Input.GetKey(KeyCode.E); } }
        public static void Clear() { Stick = Vector2.zero; GuardHeld = false; pressed = 0; }
    }

    public sealed class SenbukanStick : MonoBehaviour, IPointerDownHandler, IDragHandler, IPointerUpHandler
    {
        public RectTransform Knob;
        int pointer = int.MinValue;
        public void OnPointerDown(PointerEventData e) { if (pointer != int.MinValue) return; pointer = e.pointerId; OnDrag(e); }
        public void OnDrag(PointerEventData e)
        {
            if (pointer != e.pointerId) return;
            Vector2 point;
            var rect = (RectTransform)transform;
            if (!RectTransformUtility.ScreenPointToLocalPointInRectangle(rect, e.position, e.pressEventCamera, out point)) return;
            SenbukanInput.Stick = Vector2.ClampMagnitude(point / (rect.rect.width * .37f), 1);
            if (Knob) Knob.anchoredPosition = SenbukanInput.Stick * rect.rect.width * .28f;
        }
        public void OnPointerUp(PointerEventData e) { if (pointer != e.pointerId) return; Release(); }
        void OnDisable() { Release(); }
        void Release() { pointer = int.MinValue; SenbukanInput.Stick = Vector2.zero; if (Knob) Knob.anchoredPosition = Vector2.zero; }
    }

    public sealed class SenbukanTouchButton : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerExitHandler
    {
        public bool IsGuard;
        public SenbukanInput.Button Command;
        int pointer = int.MinValue;
        public void OnPointerDown(PointerEventData e)
        {
            if (pointer != int.MinValue) return;
            pointer = e.pointerId;
            if (IsGuard) SenbukanInput.GuardHeld = true; else SenbukanInput.Press(Command);
            var image = GetComponent<Image>(); if (image) image.color = new Color(1, .63f, .2f, .92f);
        }
        public void OnPointerUp(PointerEventData e) { if (e.pointerId == pointer) Release(); }
        public void OnPointerExit(PointerEventData e) { if (e.pointerId == pointer && IsGuard) Release(); }
        void OnDisable() { Release(); }
        void Release()
        {
            if (IsGuard) SenbukanInput.GuardHeld = false;
            pointer = int.MinValue;
            var image = GetComponent<Image>(); if (image) image.color = new Color(.055f, .025f, .1f, .84f);
        }
    }
}
