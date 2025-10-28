export const vertexShaderSource = `
  precision mediump float;
  
  attribute vec2 a_position;
  attribute float a_size;
  attribute vec4 a_color;
  
  uniform vec2 u_resolution;
  uniform float u_time;
  
  varying vec4 v_color;
  varying float v_size;
  
  void main() {
    vec2 position = a_position;
    position = position / u_resolution * 2.0 - 1.0;
    position.y *= -1.0;
    
    gl_Position = vec4(position, 0.0, 1.0);
    gl_PointSize = a_size;
    v_color = a_color;
    v_size = a_size;
  }
`

export const fragmentShaderSource = `
  precision mediump float;
  
  varying vec4 v_color;
  varying float v_size;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) {
      discard;
    }
    
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    alpha *= v_color.a;
    
    gl_FragColor = vec4(v_color.rgb, alpha);
  }
`
