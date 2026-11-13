using System;
using System.Collections.Generic;
using UnityEngine;

namespace Dedilho.Senbukan
{
    [RequireComponent(typeof(CharacterController))]
    public sealed class SenbukanFighter : MonoBehaviour
    {
        public enum State { Neutral, Attack, Dash, Hit, GuardBreak, Transform, KO }
        public bool IsPlayer;
        public string FighterName;
        public SenbukanFighter Opponent;
        public SenbukanArena Arena;
        public float MaxHP = 1000, HP = 1000, Guard = 100, Energy = 100;
        public State Current { get; private set; }
        public bool Guarding { get; private set; }
        public bool Grounded { get { return controller && controller.isGrounded; } }
        public bool Prime { get { return primeTime > 0; } }
        public float PrimeTime { get { return primeTime; } }
        public bool IsAttacking { get { return Current == State.Attack; } }
        public Vector3 Facing { get { return transform.forward; } }
        CharacterController controller;
        Animation animationPlayer;
        readonly Dictionary<string, string> clips = new Dictionary<string, string>();
        float stateTime, vertical, primeTime, guardDelay, dashCooldown, aiDelay, aiGuard, comboDelay;
        Vector3 dashDirection, push;
        string playing, attackClip;
        int punchChain, queued;
        float attackDuration, contactAt, attackDamage, attackReach, attackGuard;
        bool contactDone;
        Renderer[] renderers;
        MaterialPropertyBlock block;
        GameObject aura;
        bool lastGrounded;
        float footClock;
        static readonly Color Orange = new Color(1, .42f, .035f);

        public void Initialize(SenbukanArena arena, bool player, GameObject model)
        {
            Arena = arena; IsPlayer = player; FighterName = player ? "KARATÊ CAETANO" : "ALUNO DO SENBUKAN";
            controller = GetComponent<CharacterController>();
            controller.height = player ? 1.83f : 1.78f; controller.radius = .32f;
            controller.center = Vector3.up * controller.height * .5f; controller.stepOffset = .25f;
            controller.skinWidth = .035f; controller.slopeLimit = 45;
            if (model)
            {
                model.transform.SetParent(transform, false);
                animationPlayer = model.GetComponentInChildren<Animation>();
                if (animationPlayer)
                {
                    foreach (AnimationState clip in animationPlayer)
                    {
                        string name = clip.name.ToLowerInvariant();
                        foreach (string wanted in new[] { "punch1", "punch2", "punch3", "transform", "guard", "jump", "dash", "kick", "walk", "idle", "run", "hit", "down" })
                            if (name.Contains(wanted) && !clips.ContainsKey(wanted)) clips[wanted] = clip.name;
                    }
                }
                renderers = model.GetComponentsInChildren<Renderer>();
            }
            block = new MaterialPropertyBlock();
            aiDelay = .8f; lastGrounded = true; Play("idle", true);
        }

        public void ResetAt(Vector3 position, Quaternion rotation)
        {
            if (controller) controller.enabled = false;
            transform.SetPositionAndRotation(position, rotation);
            if (controller) controller.enabled = true;
            HP = MaxHP; Guard = 100; Energy = 100; primeTime = 0; Current = State.Neutral;
            vertical = -2; push = Vector3.zero; queued = 0; punchChain = 0; Guarding = false;
            guardDelay = dashCooldown = stateTime = comboDelay = 0; aiDelay = .8f;
            if (aura) aura.SetActive(false); UpdateGlow(); Play("idle", true, true);
        }

        void Update()
        {
            if (!Arena || !Arena.Running || !controller || Time.deltaTime <= 0) return;
            float dt = Mathf.Min(Time.deltaTime, .05f);
            stateTime += dt; guardDelay = Mathf.Max(0, guardDelay - dt); dashCooldown = Mathf.Max(0, dashCooldown - dt);
            primeTime = Mathf.Max(0, primeTime - dt); comboDelay = Mathf.Max(0, comboDelay - dt);
            if (aura) aura.SetActive(Prime);
            UpdateGlow();
            if (HP <= 0 && Current != State.KO) { Current = State.KO; stateTime = 0; Play("down", false); Arena.OnKnockout(this); }
            if (guardDelay <= 0 && !Guarding && Current != State.GuardBreak) Guard = Mathf.Min(100, Guard + dt * 17);
            Energy = Mathf.Min(100, Energy + dt * 3.5f);
            if (Grounded && vertical < 0) vertical = -2; else vertical -= 24 * dt;
            Vector3 movement = Vector3.zero;
            Vector2 input = Vector2.zero;
            bool punch = false, kick = false, dash = false, jump = false, special = false, transformRequest = false, guard = false;
            if (Current != State.KO)
            {
                if (IsPlayer)
                {
                    input = SenbukanInput.Movement; guard = SenbukanInput.Guard;
                    punch = SenbukanInput.Take(SenbukanInput.Button.Punch, KeyCode.J);
                    kick = SenbukanInput.Take(SenbukanInput.Button.Kick, KeyCode.K);
                    dash = SenbukanInput.Take(SenbukanInput.Button.Dash, KeyCode.LeftShift);
                    jump = SenbukanInput.Take(SenbukanInput.Button.Jump, KeyCode.Space);
                    special = SenbukanInput.Take(SenbukanInput.Button.Special, KeyCode.U);
                    transformRequest = SenbukanInput.Take(SenbukanInput.Button.Transform, KeyCode.F);
                }
                else if (Opponent && !Arena.StaticDummy)
                {
                    aiDelay -= dt; aiGuard -= dt;
                    float distance = Vector3.Distance(transform.position, Opponent.transform.position);
                    Vector3 toward = Opponent.transform.position - transform.position; toward.y = 0;
                    movement = toward.normalized * (distance > 2.1f ? 4.1f : distance < 1.25f ? -2.4f : 0);
                    if (distance < 6 && distance > 2.3f) movement += transform.right * Mathf.Sin(Time.time * 1.3f) * .9f;
                    if (Opponent.IsAttacking && distance < 3 && UnityEngine.Random.value < dt * 2) aiGuard = .48f;
                    guard = aiGuard > 0;
                    if (aiDelay <= 0 && distance < 2.7f) { kick = UnityEngine.Random.value < .23f; punch = !kick; aiDelay = UnityEngine.Random.Range(.65f, 1.3f); }
                }
            }
            if (Opponent && Current != State.KO)
            {
                Vector3 direction = Opponent.transform.position - transform.position; direction.y = 0;
                if (direction.sqrMagnitude > .01f && (Arena.Locked || !IsPlayer || Current != State.Neutral))
                    transform.rotation = Quaternion.RotateTowards(transform.rotation, Quaternion.LookRotation(direction), dt * 650);
            }
            if (Current == State.Neutral)
            {
                if (IsPlayer)
                {
                    Vector3 forward = Arena.CameraRig.PlanarForward, right = Arena.CameraRig.PlanarRight;
                    movement = (forward * input.y + right * input.x) * (Prime ? 7.7f : 5.7f);
                    if (!Arena.Locked && movement.sqrMagnitude > .01f)
                        transform.rotation = Quaternion.RotateTowards(transform.rotation, Quaternion.LookRotation(movement), dt * 650);
                }
                Guarding = guard && Grounded;
                if (Guarding) { movement *= .28f; Play("guard", true); }
                else Play(!Grounded ? "jump" : movement.sqrMagnitude > .5f ? "run" : "idle", true);
                if (jump && Grounded && Energy >= 8) { Energy -= 8; vertical = 9; Guarding = false; Play("jump", false, true, .75f); }
                if (transformRequest && IsPlayer && !Prime && Energy >= 60)
                {
                    Energy -= 60; primeTime = 10; Current = State.Transform; stateTime = 0; Guarding = false;
                    Play("transform", false, true, .7f); SenbukanVfx.Burst(transform.position + Vector3.up, Orange, 1.5f);
                    Arena.CameraRig.Impulse(.15f); Arena.Sound(100, .22f);
                    if (!aura) aura = SenbukanVfx.CreateAura(transform, Orange);
                }
                else if (dash && Energy >= 14 && dashCooldown <= 0)
                {
                    Energy -= 14; dashCooldown = .5f; Current = State.Dash; stateTime = 0; Guarding = false;
                    dashDirection = movement.sqrMagnitude > .1f ? movement.normalized : Facing;
                    Play("dash", false, true, .24f); SenbukanVfx.Dust(transform.position, -dashDirection, Orange);
                }
                else if (special && Energy >= 25) { Energy -= 25; StartAttack("punch3", .65f, .25f, 165, 3.1f, 100); }
                else if (kick) StartAttack("kick", .76f, .32f, 115, 2.65f, 38);
                else if (punch) { punchChain = comboDelay > 0 ? punchChain % 3 + 1 : 1; Punch(); }
            }
            else if (Current == State.Attack)
            {
                Guarding = false; movement = Facing * (stateTime < contactAt ? 1.8f : .3f);
                if (IsPlayer && stateTime > attackDuration * .4f && (punch || kick)) queued = kick ? 2 : 1;
                if (!contactDone && stateTime >= contactAt)
                {
                    contactDone = true;
                    SenbukanVfx.Strike(transform.position + Facing * 1.1f + Vector3.up * 1.05f, Facing, Prime ? Orange : new Color(1, .72f, .3f));
                    TryContact();
                }
                if (stateTime >= attackDuration)
                {
                    Current = State.Neutral; comboDelay = .85f;
                    int next = queued; queued = 0;
                    if (next == 2) StartAttack("kick", .76f, .32f, 115, 2.65f, 38);
                    else if (next == 1) { punchChain = punchChain % 3 + 1; Punch(); }
                }
            }
            else if (Current == State.Dash)
            {
                Guarding = false; movement = dashDirection * (stateTime < .14f ? 16 : 8) * (Prime ? 1.3f : 1);
                if (stateTime > .24f) { Current = State.Neutral; stateTime = 0; }
            }
            else if (Current == State.Hit || Current == State.GuardBreak)
            {
                movement = Vector3.zero; Guarding = false;
                if (stateTime > (Current == State.GuardBreak ? .8f : .19f)) { if (Current == State.GuardBreak) Guard = 45; Current = State.Neutral; }
            }
            else if (Current == State.Transform && stateTime > .7f) Current = State.Neutral;
            if (Current == State.KO) movement = Vector3.zero;
            if (animationPlayer && playing != null && playing.ToLowerInvariant().Contains("run")) animationPlayer[playing].speed = Mathf.Clamp(movement.magnitude / 3.3f, 1, 2.4f);
            movement += push; push = Vector3.MoveTowards(push, Vector3.zero, dt * 10);
            controller.Move((movement + Vector3.up * vertical) * dt);
            Vector3 position = transform.position;
            Vector3 bounded = new Vector3(Mathf.Clamp(position.x, -8.7f, 8.7f), position.y, Mathf.Clamp(position.z, -8.7f, 8.7f));
            if ((bounded - position).sqrMagnitude > 0) controller.Move(bounded - position);
            if (!lastGrounded && Grounded) SenbukanVfx.Land(transform.position, Prime ? Orange : new Color(.8f, .65f, .48f));
            lastGrounded = Grounded;
            footClock += dt;
            if (Grounded && movement.sqrMagnitude > 8 && footClock > .19f) { footClock = 0; SenbukanVfx.Dust(transform.position, -movement.normalized, new Color(.62f, .42f, .25f)); }
        }

        void Punch()
        {
            int stage = Mathf.Clamp(punchChain, 1, 3);
            StartAttack("punch" + stage, stage == 3 ? .66f : .45f, stage == 3 ? .28f : .19f, stage == 3 ? 100 : 55 + stage * 8, 2.25f, stage == 3 ? 32 : 17);
        }
        void StartAttack(string clip, float duration, float hit, float damage, float reach, float pressure)
        {
            Current = State.Attack; stateTime = 0; attackClip = clip; attackDuration = duration; contactAt = hit;
            attackDamage = damage; attackReach = reach; attackGuard = pressure; contactDone = false; Guarding = false;
            Play(clip, false, true, duration);
        }
        void TryContact()
        {
            if (!Opponent || Opponent.HP <= 0) return;
            Vector3 delta = Opponent.transform.position - transform.position;
            if (Mathf.Abs(delta.y) > 1.6f) return;
            delta.y = 0;
            if (delta.magnitude > attackReach || Vector3.Dot(Facing, delta.normalized) < .28f) return;
            bool hurt = Opponent.Receive(this, attackDamage * (Prime ? 2 : 1), attackGuard, Facing);
            if (hurt) Energy = Mathf.Min(100, Energy + 5);
        }
        public bool Receive(SenbukanFighter attacker, float damage, float pressure, Vector3 direction)
        {
            if (HP <= 0 || !Arena.Running) return false;
            Vector3 contact = transform.position + Vector3.up * 1.15f - direction * .25f;
            if (Prime) { SenbukanVfx.Burst(contact, Orange, .65f); Arena.Sound(580, .05f); return false; }
            guardDelay = 1.8f;
            if (Guarding && !attacker.Prime)
            {
                Guard = Mathf.Max(0, Guard - pressure); SenbukanVfx.Burst(contact, new Color(.4f, .82f, 1), .6f);
                Arena.Sound(720, .055f); push = direction * .45f;
                if (Guard <= 0) { Current = State.GuardBreak; stateTime = 0; Guarding = false; queued = 0; Play("hit", false, true, .8f); Arena.Notify("GUARDA ROMPIDA"); }
                return false;
            }
            HP = Mathf.Max(0, HP - damage); Guarding = false; Current = State.Hit; stateTime = 0; queued = 0;
            push = direction * .9f; Play("hit", false, true, attacker.Prime ? .8f : .19f);
            SenbukanVfx.Burst(contact, Orange, Mathf.Min(1.7f, damage / 100));
            Arena.CameraRig.Impulse(damage > 100 ? .12f : .055f); Arena.Sound(damage > 100 ? 120 : 190, .08f);
            if (HP <= 0) { Current = State.KO; Play("down", false, true); Arena.OnKnockout(this); }
            else if (attacker.Prime) { Guard = 0; guardDelay = 2; Current = State.GuardBreak; }
            return true;
        }
        void Play(string key, bool loop, bool restart = false, float duration = 0)
        {
            if (!animationPlayer || !clips.ContainsKey(key)) return;
            string clip = clips[key];
            if (!restart && playing == clip && animationPlayer.IsPlaying(clip)) return;
            playing = clip; animationPlayer[clip].speed = duration > 0 ? animationPlayer[clip].length / duration : 1; animationPlayer[clip].wrapMode = loop ? WrapMode.Loop : WrapMode.ClampForever;
            if (restart) animationPlayer[clip].time = 0;
            animationPlayer.CrossFade(clip, .085f);
        }
        void UpdateGlow()
        {
            if (renderers == null) return;
            foreach (Renderer renderer in renderers)
            {
                if (!renderer) continue;
                renderer.GetPropertyBlock(block); block.SetColor("_GlowColor", new Color(1, .35f, .02f, Prime ? .16f : 0)); renderer.SetPropertyBlock(block);
            }
        }
    }
}
