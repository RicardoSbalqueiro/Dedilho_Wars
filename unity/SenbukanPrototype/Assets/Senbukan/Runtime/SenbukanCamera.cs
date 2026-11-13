using UnityEngine;
namespace Dedilho.Senbukan
{
    public sealed class SenbukanCamera : MonoBehaviour
    {
        public SenbukanArena Arena;
        public Vector3 PlanarForward { get { Vector3 v = transform.forward; v.y = 0; return v.normalized; } }
        public Vector3 PlanarRight { get { Vector3 v = transform.right; v.y = 0; return v.normalized; } }
        Vector3 velocity, previousMouse;
        float yaw, pitch = 19, distance = 6.8f, shake;
        public void Impulse(float strength) { shake = Mathf.Max(shake, strength); }
        void LateUpdate()
        {
            if (!Arena || !Arena.Player || !Arena.Opponent) return;
            var player = Arena.Player.transform; var target = Arena.Opponent.transform;
            Vector3 mouse = Input.mousePosition, delta = mouse - previousMouse; previousMouse = mouse;
            if (Input.GetMouseButton(1)) { yaw += delta.x * .16f; pitch = Mathf.Clamp(pitch - delta.y * .11f, 9, 42); }
            if (Arena.Locked) yaw = Mathf.Clamp(yaw, -65, 65);
            distance = Mathf.Clamp(distance - Input.mouseScrollDelta.y * .35f, 4.4f, 10);
            Vector3 direction = target.position - player.position; direction.y = 0;
            if (direction.sqrMagnitude < .01f) direction = player.forward;
            Quaternion baseRotation = Arena.Locked ? Quaternion.LookRotation(direction) : Quaternion.identity;
            Quaternion orbit = baseRotation * Quaternion.Euler(pitch, yaw, 0);
            Vector3 aim = player.position + Vector3.up * 1.25f;
            if (Arena.Locked) aim += Vector3.ClampMagnitude((target.position - player.position) * .16f, new Vector3(1,0,1).magnitude);
            Vector3 wanted = aim + orbit * new Vector3(.9f, 0, -distance);
            RaycastHit hit;
            Vector3 offset = wanted - aim;
            if (Physics.SphereCast(aim, .24f, offset.normalized, out hit, offset.magnitude, 1 << 8, QueryTriggerInteraction.Ignore))
                wanted = aim + offset.normalized * Mathf.Max(.7f, hit.distance - .12f);
            transform.position = Vector3.SmoothDamp(transform.position, wanted, ref velocity, .1f, 100, Time.unscaledDeltaTime);
            Vector3 point = aim;
            if (Arena.Locked) point = Vector3.Lerp(aim, target.position + Vector3.up * 1.1f, .18f);
            transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(point - transform.position), 1 - Mathf.Exp(-Time.unscaledDeltaTime * 15));
            if (shake > 0 && Arena.Running)
            {
                float t = Time.time * 95; transform.position += (transform.right * Mathf.Sin(t) + transform.up * Mathf.Cos(t * 1.3f)) * shake;
                shake = Mathf.MoveTowards(shake, 0, Time.unscaledDeltaTime * .8f);
            }
        }
    }
}
