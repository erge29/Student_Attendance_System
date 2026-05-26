# Sistem Absensi Mahasiswa - Berbasis Komputasi Awan
# Frontend: http://localhost:8012  |  API: http://192.168.56.10:3000

Vagrant.configure("2") do |config|
  config.vm.box = "bento/ubuntu-22.04"

  [
    ["database", "192.168.56.11", "VM-Database-Absensi"],
    ["backend",  "192.168.56.10", "VM-Backend-Absensi"],
    ["frontend", "192.168.56.12", "VM-Frontend-Absensi"]
  ].each do |name, ip, vname|
    config.vm.define name do |machine|
      machine.vm.hostname = name
      machine.vm.network "private_network", ip: ip

      if name == "frontend"
        machine.vm.network "forwarded_port", guest: 80, host: 8012, host_ip: "127.0.0.1"
      end
      if name == "backend"
        machine.vm.network "forwarded_port", guest: 3000, host: 3000, host_ip: "127.0.0.1"
      end

      machine.vm.provider "virtualbox" do |vb|
        vb.name = vname
        vb.memory = "1024"
        vb.cpus = 1
      end

      machine.vm.provision "shell", inline: <<-SHELL
        set -e
        echo "=== Provisioning #{name} (#{ip}) ==="
        export DEBIAN_FRONTEND=noninteractive
        sudo apt-get update -y
        sudo apt-get install -y ansible
        sudo ansible-playbook /vagrant/playbook.yml -c local -e "target_node=#{name}"
      SHELL
    end
  end
end
